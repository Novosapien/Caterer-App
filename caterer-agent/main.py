"""FastAPI service: WhatsApp Gig Agent (Caterer Dubai prototype).

Endpoints:
  GET  /health            -> {"status": "ok"}                 (keep-warm)
  POST /notify            -> outbound trigger (shared-secret)  (Next.js caller)
  POST /webhook/whatsapp  -> Unipile inbound (JSON message event)

WhatsApp goes through Unipile (a real connected WhatsApp account), so
business-initiated first messages are freeform (no template approval) and the
agent can reach opted-in chefs proactively. The /notify contract mirrors
caterer-dubai/src/lib/agentClient.ts. DB column names mirror
caterer-dubai/supabase/migrations/0001_schema.sql. All heavy dependencies and
credentials are read lazily, so the module imports cleanly without them.
"""

from __future__ import annotations

import hmac
import logging
import os
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Header, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from src.agent.context import (
    ConversationContext,
    ResolvedCandidate,
    ResolvedThread,
    ensure_general_thread,
    load_conversation_context,
    log_message,
    make_thread_key,
    mark_whatsapp_activated,
    resolve_active_thread,
    resolve_candidate_by_phone,
    touch_thread,
    upsert_thread_active,
)
from src.agent.graph import (
    build_invite_message,
    run_general_turn,
    run_turn,
    setup_checkpointer,
    teardown_checkpointer,
)
from src.clients.unipile_client import (
    provider_id_to_e164,
    reply_in_chat,
    send_new_whatsapp,
)
from src.config import get_settings

logger = logging.getLogger("caterer_agent")
logging.basicConfig(level=logging.INFO)

# GLOBAL KILL SWITCH. All WhatsApp sending (proactive /notify AND webhook replies)
# is DISABLED unless AGENT_ENABLED is explicitly set to a truthy value. This exists
# so the agent can never auto-message from a WhatsApp account it should not (e.g. a
# personal number connected to Unipile). Default OFF is the safe default.
_AGENT_ENABLED = os.getenv("AGENT_ENABLED", "0").strip().lower() in ("1", "true", "yes", "on")


# ---------------------------------------------------------------------------
# Request / response models — MUST match agentClient.ts + the agent spec
# ---------------------------------------------------------------------------


class NotifyCandidate(BaseModel):
    candidate_id: str  # == candidate_profiles.profile_id
    name: str
    phone: str  # E.164, e.g. "+971501234567"


class NotifyGig(BaseModel):
    gig_id: str
    title: str
    role_type: str
    venue: str
    location_area: str
    pay_aed: float
    pay_unit: str  # 'shift' | 'hour' | 'day'
    start_at: str  # ISO 8601
    dress_code: Optional[str] = None
    description: Optional[str] = None
    is_urgent: bool = False


class NotifyRequest(BaseModel):
    gig: NotifyGig
    candidates: List[NotifyCandidate]


class NotifyResult(BaseModel):
    candidate_id: str
    thread_key: str
    status: str  # 'sent' | 'pending'


class NotifyResponse(BaseModel):
    results: List[NotifyResult]


# ---------------------------------------------------------------------------
# App + lifespan (open/close the Postgres checkpointer)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Try to open the checkpointer at startup so the first inbound turn is warm.
    # If credentials are absent (e.g. local import test), don't crash startup —
    # the webhook will surface the error per-request.
    try:
        setup_checkpointer()
    except Exception as exc:  # pragma: no cover - startup best-effort
        logger.warning("Checkpointer not initialised at startup: %s", exc)
    yield
    try:
        teardown_checkpointer()
    except Exception:  # pragma: no cover
        pass


app = FastAPI(title="WhatsApp Gig Agent", lifespan=lifespan)


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /notify
# ---------------------------------------------------------------------------


def _secret_ok(provided: Optional[str]) -> bool:
    expected = get_settings().notify_shared_secret
    if not expected or not provided:
        return False
    return hmac.compare_digest(provided, expected)


def _gig_to_context(gig: NotifyGig, candidate: NotifyCandidate) -> ConversationContext:
    """Build a ConversationContext straight from the /notify payload.

    Avoids a Supabase round-trip for the invite pitch (the payload already
    carries every gig fact and the candidate name).
    """
    from src.agent.context import CandidateContext, GigContext

    return ConversationContext(
        gig=GigContext(
            job_id=gig.gig_id,
            title=gig.title,
            role_type=gig.role_type,
            venue=gig.venue,
            location_area=gig.location_area,
            pay_aed=gig.pay_aed,
            pay_unit=gig.pay_unit,
            start_at=gig.start_at,
            dress_code=gig.dress_code,
            status="open",
            description=gig.description,
            is_urgent=gig.is_urgent,
        ),
        candidate=CandidateContext(
            candidate_profile_id=candidate.candidate_id,
            name=candidate.name,
            phone=candidate.phone,
        ),
    )


@app.post("/notify", response_model=NotifyResponse)
async def notify(
    payload: NotifyRequest,
    x_notify_secret: Optional[str] = Header(default=None, alias="X-Notify-Secret"),
) -> JSONResponse:
    if not _secret_ok(x_notify_secret):
        return JSONResponse(status_code=401, content={"detail": "unauthorized"})

    gig = payload.gig

    # Kill switch: when disabled, send nothing and report every candidate pending.
    if not _AGENT_ENABLED:
        logger.warning("notify: agent sending disabled (AGENT_ENABLED not set); no sends")
        return JSONResponse(
            status_code=200,
            content=NotifyResponse(
                results=[
                    NotifyResult(
                        candidate_id=c.candidate_id,
                        thread_key=make_thread_key(c.candidate_id, gig.gig_id),
                        status="pending",
                    )
                    for c in payload.candidates
                ]
            ).model_dump(),
        )

    results: List[NotifyResult] = []

    for candidate in payload.candidates:
        thread_key = make_thread_key(candidate.candidate_id, gig.gig_id)
        status = "pending"

        # 1. Maintain "one active thread per phone": close others, upsert active.
        try:
            upsert_thread_active(
                thread_key=thread_key,
                phone=candidate.phone,
                candidate_profile_id=candidate.candidate_id,
                job_id=gig.gig_id,
            )
        except Exception as exc:
            logger.exception("notify: thread upsert failed for %s: %s", thread_key, exc)
            results.append(
                NotifyResult(
                    candidate_id=candidate.candidate_id,
                    thread_key=thread_key,
                    status="pending",
                )
            )
            continue

        # 2. Build the invite and send via Unipile WhatsApp (freeform first message).
        context = _gig_to_context(gig, candidate)
        invite = build_invite_message(context)
        try:
            send_new_whatsapp(candidate.phone, invite)
            status = "sent"
        except Exception as exc:
            # Any send failure (unreachable number / Unipile error) -> pending.
            logger.warning("notify: send blocked for %s: %s", candidate.phone, exc)
            status = "pending"

        # 3. Log the outbound invite as the first whatsapp_messages row.
        try:
            log_message(thread_key=thread_key, direction="out", body=invite)
        except Exception as exc:  # logging must never crash the endpoint
            logger.warning("notify: message log failed for %s: %s", thread_key, exc)

        results.append(
            NotifyResult(
                candidate_id=candidate.candidate_id,
                thread_key=thread_key,
                status=status,
            )
        )

    return JSONResponse(
        status_code=200, content=NotifyResponse(results=results).model_dump()
    )


# ---------------------------------------------------------------------------
# POST /webhook/whatsapp  (Unipile inbound — JSON message event)
# ---------------------------------------------------------------------------

_UNKNOWN_SENDER_REPLY = (
    "Hi! I'm the Caterer Dubai assistant. I can't find your profile from this "
    "number. Sign up in the app and add this mobile, then message me and I'll "
    "help you find shifts."
)

_OK = JSONResponse(status_code=200, content={"status": "ok"})


def _first_str(payload: dict, *keys: str) -> str:
    """Return the first non-empty string among payload[key] for the given keys."""
    for key in keys:
        val = payload.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def _parse_unipile_message(payload: dict) -> Optional[tuple[str, str, str]]:
    """Turn a Unipile webhook body into (from_phone_e164, text, chat_id), or None.

    Unipile posts a JSON event for each message. Field names vary by API version,
    so we read tolerantly. We ignore anything the connected account sent itself
    (echo of our own outbound) so the agent never replies to its own messages.
    """
    if not isinstance(payload, dict):
        return None

    # Ignore echoes of our own outbound (Unipile flags the account as the sender).
    for flag in ("from_me", "is_sender", "is_self"):
        if payload.get(flag):
            return None

    # chat_id — the conversation we reply into.
    chat_id = _first_str(payload, "chat_id", "chat", "conversation_id")
    if not chat_id:
        chat = payload.get("chat")
        if isinstance(chat, dict):
            chat_id = _first_str(chat, "id", "chat_id")

    # Message text — may be a top-level string or nested under `message`.
    text = _first_str(payload, "message", "text", "body")
    if not text:
        msg = payload.get("message")
        if isinstance(msg, dict):
            text = _first_str(msg, "text", "body")

    # Sender provider id ("971...@s.whatsapp.net") -> E.164.
    provider_id = _first_str(
        payload, "attendee_provider_id", "provider_id", "from", "sender"
    )
    if not provider_id:
        sender = payload.get("sender")
        if isinstance(sender, dict):
            provider_id = _first_str(
                sender, "attendee_provider_id", "provider_id", "id"
            )
    from_phone = provider_id_to_e164(provider_id) if provider_id else ""

    if not from_phone or not chat_id:
        return None
    return from_phone, text, chat_id


def _send_reply(chat_id: str, text: str) -> None:
    """Best-effort async reply into a Unipile chat (never raises to the caller)."""
    if not chat_id or not text:
        return
    try:
        reply_in_chat(chat_id, text)
    except Exception as exc:
        logger.warning("webhook: reply send failed for chat %s: %s", chat_id, exc)


_SNAG_REPLY = "Sorry, something went wrong. Please send that again in a moment."


def _handle_gig_turn(thread: ResolvedThread, inbound_text: str, chat_id: str) -> Response:
    """Handle an inbound reply that belongs to a specific gig thread."""
    thread_key = thread.thread_key
    job_id = thread.job_id
    candidate_profile_id = thread.candidate_profile_id

    # They messaged us, so they're activated for proactive sends going forward.
    try:
        mark_whatsapp_activated(candidate_profile_id)
    except Exception as exc:  # pragma: no cover - never fatal
        logger.warning("webhook: activation stamp failed for %s: %s", candidate_profile_id, exc)

    try:
        log_message(thread_key=thread_key, direction="in", body=inbound_text)
    except Exception as exc:
        logger.warning("webhook: inbound log failed for %s: %s", thread_key, exc)

    try:
        context = load_conversation_context(job_id, candidate_profile_id)
        reply = run_turn(
            thread_key=thread_key,
            job_id=job_id,
            candidate_profile_id=candidate_profile_id,
            context=context,
            inbound_text=inbound_text,
        )
    except Exception as exc:
        logger.exception("webhook: gig turn failed for %s: %s", thread_key, exc)
        reply = _SNAG_REPLY

    try:
        log_message(thread_key=thread_key, direction="out", body=reply)
    except Exception as exc:
        logger.warning("webhook: outbound log failed for %s: %s", thread_key, exc)
    try:
        touch_thread(thread_key)
    except Exception as exc:
        logger.warning("webhook: touch_thread failed for %s: %s", thread_key, exc)

    _send_reply(chat_id, reply)
    return _OK


def _handle_general_turn(
    candidate: ResolvedCandidate, inbound_text: str, chat_id: str
) -> Response:
    """Handle an inbound with no gig on the table: general assistant + job search."""
    # Open/refresh the general thread and mark the candidate activated.
    try:
        thread_key = ensure_general_thread(
            candidate_profile_id=candidate.candidate_profile_id, phone=candidate.phone
        )
    except Exception as exc:
        logger.exception("webhook: general thread upsert failed for %s: %s", candidate.phone, exc)
        _send_reply(chat_id, _SNAG_REPLY)
        return _OK

    try:
        mark_whatsapp_activated(candidate.candidate_profile_id)
    except Exception as exc:  # pragma: no cover - never fatal
        logger.warning("webhook: activation stamp failed for %s: %s", candidate.candidate_profile_id, exc)

    try:
        log_message(thread_key=thread_key, direction="in", body=inbound_text)
    except Exception as exc:
        logger.warning("webhook: inbound log failed for %s: %s", thread_key, exc)

    try:
        reply = run_general_turn(
            thread_key=thread_key, candidate=candidate, inbound_text=inbound_text
        )
    except Exception as exc:
        logger.exception("webhook: general turn failed for %s: %s", thread_key, exc)
        reply = _SNAG_REPLY

    try:
        log_message(thread_key=thread_key, direction="out", body=reply)
    except Exception as exc:
        logger.warning("webhook: outbound log failed for %s: %s", thread_key, exc)
    try:
        touch_thread(thread_key)
    except Exception as exc:
        logger.warning("webhook: touch_thread failed for %s: %s", thread_key, exc)

    _send_reply(chat_id, reply)
    return _OK


@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request) -> Response:
    # Kill switch: when disabled, ack every inbound and reply to NONE. This stops
    # the agent auto-replying to a connected account's normal WhatsApp traffic.
    if not _AGENT_ENABLED:
        return _OK

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    parsed = _parse_unipile_message(payload if isinstance(payload, dict) else {})
    if parsed is None:
        # Not an actionable inbound (echo, status event, or unparseable) — ack and drop.
        return _OK
    from_phone, inbound_text, chat_id = parsed

    # Resolve the active thread for this phone.
    thread: Optional[ResolvedThread] = None
    try:
        thread = resolve_active_thread(from_phone)
    except Exception as exc:
        logger.exception("webhook: thread resolve failed for %s: %s", from_phone, exc)

    # A thread tied to a specific gig -> gig conversation (accept/decline).
    if thread is not None and thread.job_id:
        return _handle_gig_turn(thread, inbound_text, chat_id)

    # Otherwise general: identify the candidate by their phone number.
    candidate: Optional[ResolvedCandidate] = None
    try:
        candidate = resolve_candidate_by_phone(from_phone)
    except Exception as exc:
        logger.exception("webhook: candidate resolve failed for %s: %s", from_phone, exc)

    if candidate is None:
        # Not a registered number (e.g. a normal contact messaging this account).
        # Stay SILENT: never auto-reply to someone who isn't a known candidate.
        return _OK

    return _handle_general_turn(candidate, inbound_text, chat_id)
