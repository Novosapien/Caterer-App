"""FastAPI service: WhatsApp Gig Agent (Caterer Dubai prototype).

Endpoints:
  GET  /health            -> {"status": "ok"}                 (keep-warm)
  POST /notify            -> outbound trigger (shared-secret)  (Next.js caller)
  POST /webhook/whatsapp  -> Twilio inbound (form From, Body)

The /notify contract mirrors caterer-dubai/src/lib/agentClient.ts. DB column
names mirror caterer-dubai/supabase/migrations/0001_schema.sql. All heavy
dependencies and credentials are read lazily, so the module imports cleanly
without them.
"""

from __future__ import annotations

import hmac
import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Header, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from twilio.twiml.messaging_response import MessagingResponse

from src.agent.context import (
    ConversationContext,
    load_conversation_context,
    log_message,
    make_thread_key,
    resolve_active_thread,
    touch_thread,
    upsert_thread_active,
)
from src.agent.graph import (
    build_invite_message,
    run_turn,
    setup_checkpointer,
    teardown_checkpointer,
)
from src.clients.twilio_client import send_whatsapp
from src.config import get_settings

logger = logging.getLogger("caterer_agent")
logging.basicConfig(level=logging.INFO)


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

        # 2. Build the invite and send via Twilio WhatsApp.
        context = _gig_to_context(gig, candidate)
        invite = build_invite_message(context)
        try:
            send_whatsapp(candidate.phone, invite)
            status = "sent"
        except Exception as exc:
            # Any send failure (not joined / outside 24h window / Twilio error) -> pending.
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
# POST /webhook/whatsapp  (Twilio inbound — form-encoded From/Body)
# ---------------------------------------------------------------------------

_UNKNOWN_SENDER_REPLY = "Hi! I can only chat about a gig I've sent you."


def _from_to_e164(raw: str) -> str:
    """Twilio inbound From ("whatsapp:+447883098500") -> E.164 ("+447883098500")."""
    raw = (raw or "").strip()
    if raw.startswith("whatsapp:"):
        raw = raw[len("whatsapp:"):]
    return raw.strip()


def _twiml(text: str) -> Response:
    """Build a TwiML reply. Replying in the webhook response is freeform-allowed
    inside the 24h WhatsApp session window, so it sidesteps the ContentSid/template
    requirement that a REST push would hit on this account.
    """
    tw = MessagingResponse()
    if text:
        tw.message(text)
    return Response(content=str(tw), media_type="application/xml")


@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request) -> Response:
    try:
        form = await request.form()
    except Exception:
        form = {}

    from_phone = _from_to_e164(str(form.get("From", "")))
    inbound_text = str(form.get("Body", "") or "").strip()

    # 1. Resolve the thread from the phone.
    thread: Optional[object] = None
    if from_phone:
        try:
            thread = resolve_active_thread(from_phone)
        except Exception as exc:
            logger.exception("webhook: thread resolve failed for %s: %s", from_phone, exc)

    if thread is None:
        # Unknown sender: polite fallback in the webhook response (freeform-safe).
        return _twiml(_UNKNOWN_SENDER_REPLY)

    thread_key = thread.thread_key  # type: ignore[attr-defined]
    job_id = thread.job_id  # type: ignore[attr-defined]
    candidate_profile_id = thread.candidate_profile_id  # type: ignore[attr-defined]

    # 2. Log the inbound message (mirror for the app/dashboard).
    try:
        log_message(thread_key=thread_key, direction="in", body=inbound_text)
    except Exception as exc:
        logger.warning("webhook: inbound log failed for %s: %s", thread_key, exc)

    # 3. Load gig + candidate context and run the agent turn.
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
        logger.exception("webhook: agent turn failed for %s: %s", thread_key, exc)
        reply = "Sorry, I hit a snag just now, could you send that again in a moment?"

    # 4. Log outbound + bump last_activity_at, then reply via TwiML (freeform-safe).
    try:
        log_message(thread_key=thread_key, direction="out", body=reply)
    except Exception as exc:
        logger.warning("webhook: outbound log failed for %s: %s", thread_key, exc)

    try:
        touch_thread(thread_key)
    except Exception as exc:
        logger.warning("webhook: touch_thread failed for %s: %s", thread_key, exc)

    return _twiml(reply)
