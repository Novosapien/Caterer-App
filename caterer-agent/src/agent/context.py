"""Thread routing + gig/candidate context loading.

This module owns the Supabase reads that turn a Unipile inbound (phone only) into
a concrete conversation:

  1. `resolve_active_thread(phone)` -> the single `active` whatsapp_threads row
     for that phone, giving (thread_key, candidate_profile_id, job_id).
  2. `load_conversation_context(job_id, candidate_profile_id)` -> the gig +
     candidate details used to build the system prompt each turn.

Plus small helpers used by /notify to maintain the "one active thread per phone"
invariant and to mirror messages into whatsapp_messages.

Column names match caterer-dubai/supabase/migrations/0001_schema.sql exactly.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Optional

from src.clients.supabase import get_supabase


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_thread_key(candidate_profile_id: str, job_id: str) -> str:
    """thread_key = "{candidate_profile_id}:{job_id}" (also the LangGraph thread_id)."""
    return f"{candidate_profile_id}:{job_id}"


def make_general_thread_key(candidate_profile_id: str) -> str:
    """Thread key for a general (non-gig) conversation with a candidate.

    Used when a candidate messages the assistant with no specific gig on the
    table (e.g. "any jobs going?"). Distinct from any gig thread key so the
    LangGraph checkpointer keeps general chat history separate.
    """
    return f"{candidate_profile_id}:general"


# ---------------------------------------------------------------------------
# Data holders
# ---------------------------------------------------------------------------


@dataclass
class ResolvedThread:
    thread_key: str
    phone: str
    candidate_profile_id: str
    job_id: Optional[str]  # None for a general (non-gig) thread
    status: str


@dataclass
class ResolvedCandidate:
    """A candidate resolved from an inbound phone number (no gig context).

    Carries just enough profile to greet them, search fitting gigs, and route
    future messages. Populated by resolve_candidate_by_phone.
    """
    candidate_profile_id: str
    name: Optional[str]
    phone: str
    specialisms: Optional[list] = None
    desired_roles: Optional[list] = None
    interests: Optional[list] = None
    location_area: Optional[str] = None


@dataclass
class GigContext:
    job_id: str
    title: Optional[str]
    role_type: Optional[str]
    venue: Optional[str]
    location_area: Optional[str]
    pay_aed: Optional[float]
    pay_unit: Optional[str]
    start_at: Optional[str]
    dress_code: Optional[str]
    status: Optional[str]
    description: Optional[str]
    is_urgent: Optional[bool] = None


@dataclass
class CandidateContext:
    candidate_profile_id: str
    name: Optional[str]
    phone: Optional[str]
    headline: Optional[str] = None
    years_experience: Optional[int] = None
    specialisms: Optional[list] = None
    cuisines: Optional[list] = None
    certifications: Optional[list] = None
    languages: Optional[list] = None
    bio: Optional[str] = None
    desired_roles: Optional[list] = None
    has_cv: bool = False


@dataclass
class ConversationContext:
    gig: GigContext
    candidate: CandidateContext


# ---------------------------------------------------------------------------
# Reliability helper: one retry on transient Supabase errors
# ---------------------------------------------------------------------------


def _with_retry(fn, *, retries: int = 1, backoff_s: float = 0.5):
    """Call `fn`, retrying once after a short backoff on any exception.

    Used for the transient-Supabase-error case from the spec (1 retry ~500ms).
    """
    attempt = 0
    while True:
        try:
            return fn()
        except Exception:
            if attempt >= retries:
                raise
            attempt += 1
            time.sleep(backoff_s)


# ---------------------------------------------------------------------------
# Thread routing
# ---------------------------------------------------------------------------


def resolve_active_thread(phone: str) -> Optional[ResolvedThread]:
    """Return the single `active` whatsapp_threads row for `phone`, or None.

    The webhook resolves the sender's provider id to an E.164 number, which we
    match against the bare E.164 number stored in whatsapp_threads.phone.
    """
    bare = phone.replace("whatsapp:", "").strip()
    sb = get_supabase()

    def _query():
        return (
            sb.table("whatsapp_threads")
            .select("thread_key, phone, candidate_profile_id, job_id, status")
            .eq("phone", bare)
            .eq("status", "active")
            .order("last_activity_at", desc=True)
            .limit(1)
            .execute()
        )

    resp = _with_retry(_query)
    rows = resp.data or []
    if not rows:
        return None
    row = rows[0]
    return ResolvedThread(
        thread_key=row["thread_key"],
        phone=row["phone"],
        candidate_profile_id=row["candidate_profile_id"],
        job_id=row["job_id"],
        status=row["status"],
    )


def upsert_thread_active(
    *,
    thread_key: str,
    phone: str,
    candidate_profile_id: str,
    job_id: Optional[str],
) -> None:
    """Upsert the thread row as `active`, and close every OTHER active thread
    for that phone — guaranteeing exactly one active thread per phone.

    job_id is None for a general (non-gig) thread.
    """
    bare = phone.replace("whatsapp:", "").strip()
    sb = get_supabase()

    # 1. Close all currently-active threads for this phone.
    _with_retry(
        lambda: sb.table("whatsapp_threads")
        .update({"status": "closed"})
        .eq("phone", bare)
        .eq("status", "active")
        .execute()
    )

    # 2. Upsert this thread as active with a fresh last_activity_at.
    row = {
        "thread_key": thread_key,
        "phone": bare,
        "candidate_profile_id": candidate_profile_id,
        "job_id": job_id,
        "status": "active",
        "last_activity_at": _now_iso(),
    }
    _with_retry(
        lambda: sb.table("whatsapp_threads")
        .upsert(row, on_conflict="thread_key")
        .execute()
    )


def touch_thread(thread_key: str) -> None:
    """Bump last_activity_at for a thread (called after an inbound turn)."""
    sb = get_supabase()
    _with_retry(
        lambda: sb.table("whatsapp_threads")
        .update({"last_activity_at": _now_iso()})
        .eq("thread_key", thread_key)
        .execute()
    )


# ---------------------------------------------------------------------------
# General (non-gig) inbound: resolve candidate by phone + activation
# ---------------------------------------------------------------------------


def resolve_candidate_by_phone(phone: str) -> Optional[ResolvedCandidate]:
    """Find the candidate behind an inbound phone number, or None.

    Used when a candidate messages the assistant with no active gig thread. We
    match the bare E.164 number against profiles.phone and pull the candidate's
    role signals so the assistant can search fitting gigs.
    """
    bare = phone.replace("whatsapp:", "").strip()
    if not bare:
        return None
    sb = get_supabase()

    def _query():
        return (
            sb.table("candidate_profiles")
            .select(
                "profile_id, specialisms, desired_roles, interests, location_area, "
                "profiles!inner(name, phone)"
            )
            .eq("profiles.phone", bare)
            .limit(1)
            .execute()
        )

    resp = _with_retry(_query)
    rows = resp.data or []
    if not rows:
        return None
    row = rows[0]
    profile = row.get("profiles") or {}
    if isinstance(profile, list):
        profile = profile[0] if profile else {}
    return ResolvedCandidate(
        candidate_profile_id=row["profile_id"],
        name=profile.get("name"),
        phone=bare,
        specialisms=row.get("specialisms"),
        desired_roles=row.get("desired_roles"),
        interests=row.get("interests"),
        location_area=row.get("location_area"),
    )


def ensure_general_thread(*, candidate_profile_id: str, phone: str) -> str:
    """Open (or refresh) a general, non-gig thread for this candidate.

    Maintains the "one active thread per phone" invariant like a gig thread, but
    with job_id NULL. Returns the general thread_key.
    """
    thread_key = make_general_thread_key(candidate_profile_id)
    upsert_thread_active(
        thread_key=thread_key,
        phone=phone,
        candidate_profile_id=candidate_profile_id,
        job_id=None,
    )
    return thread_key


def mark_whatsapp_activated(candidate_profile_id: str) -> None:
    """Stamp whatsapp_activated_at on first inbound (best-effort, idempotent-ish).

    This is what unlocks proactive sends to the candidate (they messaged us
    first). Tolerant of the column not existing yet (pre-0007 migration) so an
    inbound turn never fails on it.
    """
    sb = get_supabase()
    try:
        sb.table("candidate_profiles").update(
            {"whatsapp_activated_at": _now_iso()}
        ).eq("profile_id", candidate_profile_id).is_(
            "whatsapp_activated_at", "null"
        ).execute()
    except Exception:
        # Column absent (migration not applied) or transient error — never fatal.
        pass


# ---------------------------------------------------------------------------
# Message log (mirror for the app/dashboard; NOT the agent's memory source)
# ---------------------------------------------------------------------------


def log_message(*, thread_key: str, direction: str, body: str) -> None:
    """Insert a whatsapp_messages row. direction is 'in' or 'out'."""
    sb = get_supabase()
    _with_retry(
        lambda: sb.table("whatsapp_messages")
        .insert(
            {
                "thread_key": thread_key,
                "direction": direction,
                "body": body,
            }
        )
        .execute()
    )


# ---------------------------------------------------------------------------
# Context loading (gig + candidate) for the system prompt
# ---------------------------------------------------------------------------


def _row_to_gig(job_id: str, row: Optional[dict[str, Any]]) -> GigContext:
    if not row:
        return GigContext(
            job_id=job_id,
            title=None,
            role_type=None,
            venue=None,
            location_area=None,
            pay_aed=None,
            pay_unit=None,
            start_at=None,
            dress_code=None,
            status=None,
            description=None,
        )
    pay = row.get("pay_aed")
    return GigContext(
        job_id=job_id,
        title=row.get("title"),
        role_type=row.get("role_type"),
        venue=row.get("venue"),
        location_area=row.get("location_area"),
        pay_aed=float(pay) if pay is not None else None,
        pay_unit=row.get("pay_unit"),
        start_at=row.get("start_at"),
        dress_code=row.get("dress_code"),
        status=row.get("status"),
        description=row.get("description"),
        is_urgent=row.get("is_urgent"),
    )


def load_gig(job_id: str) -> GigContext:
    """Load a gig from `jobs` by id."""
    sb = get_supabase()

    def _query():
        return (
            sb.table("jobs")
            .select(
                "id, title, role_type, venue, location_area, pay_aed, pay_unit, "
                "start_at, dress_code, status, description, is_urgent"
            )
            .eq("id", job_id)
            .limit(1)
            .execute()
        )

    resp = _with_retry(_query)
    rows = resp.data or []
    return _row_to_gig(job_id, rows[0] if rows else None)


def load_candidate(candidate_profile_id: str) -> CandidateContext:
    """Load a candidate's profile/CV from candidate_profiles joined to profiles.

    candidate_profiles.profile_id is the PK and FK to profiles.id, which carries
    name/phone. The CV-relevant fields (headline, specialisms, cuisines, etc.)
    live on candidate_profiles itself, so the agent can answer fit/CV questions.
    """
    sb = get_supabase()

    def _query():
        return (
            sb.table("candidate_profiles")
            .select(
                "profile_id, headline, years_experience, specialisms, cuisines, "
                "certifications, languages, bio, desired_roles, cv_url, cv_extracted, "
                "profiles(name, phone)"
            )
            .eq("profile_id", candidate_profile_id)
            .limit(1)
            .execute()
        )

    resp = _with_retry(_query)
    rows = resp.data or []
    if not rows:
        return CandidateContext(
            candidate_profile_id=candidate_profile_id, name=None, phone=None
        )
    row = rows[0]
    profile = row.get("profiles") or {}
    # Supabase may return the embedded relation as a dict or a single-item list.
    if isinstance(profile, list):
        profile = profile[0] if profile else {}
    return CandidateContext(
        candidate_profile_id=candidate_profile_id,
        name=profile.get("name"),
        phone=profile.get("phone"),
        headline=row.get("headline"),
        years_experience=row.get("years_experience"),
        specialisms=row.get("specialisms"),
        cuisines=row.get("cuisines"),
        certifications=row.get("certifications"),
        languages=row.get("languages"),
        bio=row.get("bio"),
        desired_roles=row.get("desired_roles"),
        has_cv=bool(row.get("cv_url") or row.get("cv_extracted")),
    )


def load_conversation_context(
    job_id: str, candidate_profile_id: str
) -> ConversationContext:
    """Assemble the {gig, candidate} context for a turn."""
    return ConversationContext(
        gig=load_gig(job_id),
        candidate=load_candidate(candidate_profile_id),
    )
