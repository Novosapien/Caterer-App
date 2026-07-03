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

from src.agent.context import load_gig
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
