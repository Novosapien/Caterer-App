"""Agent tools: get_gig_details, accept_gig, decline_gig.

Per the agent spec, tools take NO LLM-supplied id arguments. `job_id` and
`candidate_profile_id` are INJECTED by the webhook handler from the resolved
thread, via a closure (`build_tools`). The LLM only decides WHICH tool to call,
never WHICH record — it cannot fabricate ids.

Writes go to `applications` and are idempotent on the unique
(job_id, candidate_profile_id) target, with source='whatsapp'. Column names
match caterer-dubai/supabase/migrations/0001_schema.sql exactly.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Optional

from langchain_core.tools import tool

from src.agent.context import ResolvedCandidate, load_gig
from src.clients.supabase import get_supabase


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _with_retry(fn, *, retries: int = 1, backoff_s: float = 0.5):
    """One retry after ~500ms on transient Supabase errors (per spec)."""
    attempt = 0
    while True:
        try:
            return fn()
        except Exception:
            if attempt >= retries:
                raise
            attempt += 1
            time.sleep(backoff_s)


def _format_start_label(start_at: Optional[str]) -> Optional[str]:
    """Produce a warm human Dubai-time label, e.g. "tonight at 7pm".

    Interprets `start_at` (ISO 8601) in Asia/Dubai (UTC+4). Falls back to a
    plain time string, then to None, if parsing fails.
    """
    if not start_at:
        return None
    try:
        # Python 3.11 handles the trailing "Z"; be defensive for older parsers.
        iso = start_at.replace("Z", "+00:00")
        dt = datetime.fromisoformat(iso)
    except (ValueError, TypeError):
        return None

    # Convert to Dubai time (UTC+4, no DST).
    try:
        from datetime import timedelta

        dubai = timezone(timedelta(hours=4))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        dt = dt.astimezone(dubai)
    except Exception:  # pragma: no cover - defensive
        pass

    hour = dt.hour
    suffix = "am" if hour < 12 else "pm"
    display_hour = hour % 12
    if display_hour == 0:
        display_hour = 12
    if dt.minute:
        clock = f"{display_hour}:{dt.minute:02d}{suffix}"
    else:
        clock = f"{display_hour}{suffix}"

    # Same-calendar-date (in Dubai) reads as "tonight"/"today"; else the weekday.
    now_dubai = datetime.now(dt.tzinfo)
    if dt.date() == now_dubai.date():
        part = "tonight" if hour >= 17 else "today"
        return f"{part} at {clock}"
    return f"{dt.strftime('%A')} at {clock}"


def _upsert_application(job_id: str, candidate_profile_id: str, status: str) -> dict:
    """Idempotently upsert an applications row for (job, candidate).

    Returns {"already": bool} indicating whether a row with this status already
    existed. Upsert targets the unique (job_id, candidate_profile_id) index and
    always sets source='whatsapp'.
    """
    sb = get_supabase()

    # Check existing row for idempotency signalling.
    def _existing():
        return (
            sb.table("applications")
            .select("id, status")
            .eq("job_id", job_id)
            .eq("candidate_profile_id", candidate_profile_id)
            .limit(1)
            .execute()
        )

    existing_resp = _with_retry(_existing)
    existing_rows = existing_resp.data or []
    already = bool(existing_rows) and existing_rows[0].get("status") == status

    row = {
        "job_id": job_id,
        "candidate_profile_id": candidate_profile_id,
        "status": status,
        "source": "whatsapp",
        "updated_at": _now_iso(),
    }
    _with_retry(
        lambda: sb.table("applications")
        .upsert(row, on_conflict="job_id,candidate_profile_id")
        .execute()
    )
    return {"already": already}


# ---------------------------------------------------------------------------
# Tool factory — binds ids via closure so the LLM never emits them
# ---------------------------------------------------------------------------


def build_tools(job_id: str, candidate_profile_id: str) -> list:
    """Return [get_gig_details, accept_gig, decline_gig] with ids injected.

    Each tool takes no arguments the LLM supplies; the ids are captured here.
    """

    @tool
    def get_gig_details() -> dict:
        """Fetch the up-to-date details of the gig this conversation is about.

        Use this if the chef asks something not already in context, or to confirm
        the gig is still open. Takes no arguments.
        """
        gig = load_gig(job_id)
        if gig.title is None and gig.status is None:
            return {"found": False}
        return {
            "found": True,
            "title": gig.title,
            "venue": gig.venue,
            "location_area": gig.location_area,
            "pay_aed": gig.pay_aed,
            "pay_unit": gig.pay_unit,
            "start_at": gig.start_at,
            "dress_code": gig.dress_code,
            "status": gig.status,
            "description": gig.description,
        }

    @tool
    def accept_gig() -> dict:
        """Record that the chef has ACCEPTED the gig. Takes no arguments.

        Call this only when the chef clearly commits ("I'm in", "yes please",
        "count me in"). Idempotent: a second accept does not create a duplicate.
        """
        gig = load_gig(job_id)
        # If the gig just filled/closed, don't record an acceptance.
        if gig.status in ("filled", "closed"):
            return {
                "ok": False,
                "already": False,
                "status": gig.status,
                "gig_title": gig.title,
                "start_at": gig.start_at,
                "start_label": _format_start_label(gig.start_at),
            }

        try:
            result = _upsert_application(job_id, candidate_profile_id, "accepted")
        except Exception:
            return {
                "ok": False,
                "already": False,
                "status": "error",
                "gig_title": gig.title,
                "start_at": gig.start_at,
                "start_label": _format_start_label(gig.start_at),
            }

        return {
            "ok": True,
            "already": result["already"],
            "status": "accepted",
            "gig_title": gig.title,
            "start_at": gig.start_at,
            "start_label": _format_start_label(gig.start_at),
        }

    @tool
    def decline_gig() -> dict:
        """Record that the chef has DECLINED the gig. Takes no arguments.

        Call this only when the chef clearly declines ("can't tonight",
        "no thanks"). Idempotent on (job, candidate).
        """
        try:
            _upsert_application(job_id, candidate_profile_id, "declined")
        except Exception:
            return {"ok": False, "status": "error"}
        return {"ok": True, "status": "declined"}

    return [get_gig_details, accept_gig, decline_gig]


# ---------------------------------------------------------------------------
# General (non-gig) mode: search open gigs that fit the candidate
# ---------------------------------------------------------------------------

# Keyword -> role family. Mirrors caterer-dubai/src/lib/matching.ts so the agent
# and the app classify roles the same way (a waiter never sees head-chef gigs).
_FAMILY_KEYWORDS: dict[str, list[str]] = {
    "kitchen": [
        "chef", "cook", "commis", "sous", "cdp", "chef de partie", "pastry",
        "grill", "larder", "kitchen", "culinary", "prep", "demi",
        "kitchen porter", " kp",
    ],
    "front": [
        "waiter", "waitress", "server", "waiting", "host", "hostess", "runner",
        "busser", "front of house", "foh", "service staff", "floor",
    ],
    "bar": ["bartender", "barback", "mixologist", "bar staff", "bar "],
    "barista": ["barista", "coffee"],
    "events": [
        "events crew", "event staff", "banquet", "catering crew", "steward",
        "usher", "hospitality crew",
    ],
}


def _families_from(values: list) -> set:
    """Classify free-text role/skill strings into the families they imply."""
    hay = " " + " ".join(str(v) for v in values if v).lower() + " "
    return {fam for fam, kws in _FAMILY_KEYWORDS.items() if any(k in hay for k in kws)}


def _candidate_families(candidate: ResolvedCandidate) -> set:
    return _families_from(
        list(candidate.specialisms or [])
        + list(candidate.desired_roles or [])
        + list(candidate.interests or [])
    )


def _job_pay_label(row: dict) -> str:
    pay = row.get("pay_aed")
    if pay is None:
        return "pay on ask"
    amount = int(pay) if float(pay).is_integer() else pay
    return f"AED {amount} per {row.get('pay_unit') or 'shift'}"


def build_general_tools(candidate: ResolvedCandidate) -> list:
    """Return [search_open_gigs] for the general (non-gig) assistant.

    The candidate is captured by closure so the LLM never supplies ids or role
    filters — it only decides WHEN to search. Results are pre-filtered to the
    candidate's role family (and their area, when set) so a waiter is never
    shown a head-chef gig.
    """
    fams = _candidate_families(candidate)
    area = (candidate.location_area or "").strip()

    @tool
    def search_open_gigs() -> dict:
        """List currently open gigs that fit this candidate's line of work.

        Use when the candidate asks what shifts/jobs are going, or to see if
        anything fits them right now. Takes no arguments. Returns up to 5 open
        gigs in their role family (and area, if known), soonest first.
        """
        sb = get_supabase()

        def _query():
            return (
                sb.table("jobs")
                .select(
                    "id, title, role_type, venue, location_area, pay_aed, "
                    "pay_unit, start_at, is_urgent, status"
                )
                .eq("status", "open")
                .order("start_at", desc=False)
                .limit(40)
                .execute()
            )

        try:
            resp = _with_retry(_query)
        except Exception:
            return {"ok": False, "gigs": []}

        rows = resp.data or []
        out = []
        for row in rows:
            gig_fams = _families_from([row.get("role_type"), row.get("title")])
            # Family gate: if the gig has a derivable family, it must overlap the
            # candidate's. Gigs with no derivable family are allowed through.
            if gig_fams and fams and not (gig_fams & fams):
                continue
            if gig_fams and not fams:
                # Unknown candidate family -> don't guess; skip family-specific gigs.
                continue
            if area and row.get("location_area") and row["location_area"] != area:
                continue
            out.append(
                {
                    "role": row.get("role_type") or row.get("title"),
                    "venue": row.get("venue"),
                    "area": row.get("location_area"),
                    "pay": _job_pay_label(row),
                    "start_at": row.get("start_at"),
                    "urgent": bool(row.get("is_urgent")),
                }
            )
            if len(out) >= 5:
                break

        return {"ok": True, "gigs": out, "count": len(out)}

    return [search_open_gigs]
