"""Twilio REST client for WhatsApp send.

All outbound WhatsApp messages go through the REST API (never TwiML). The client
is lazily constructed and cached. `send_whatsapp` returns True on success and
raises on any Twilio error, so callers can distinguish "sent" from "pending".
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from src.config import get_settings

if TYPE_CHECKING:  # pragma: no cover - import only for type hints
    from twilio.rest import Client as TwilioRestClient


@lru_cache(maxsize=1)
def get_twilio() -> "TwilioRestClient":
    """Return a cached Twilio REST client (credentials required at call time)."""
    from twilio.rest import Client

    settings = get_settings()
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise RuntimeError(
            "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set to use Twilio."
        )
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def _to_whatsapp_address(phone: str) -> str:
    """Normalize a bare E.164 number to a Twilio WhatsApp address.

    Accepts either "+971501234567" or "whatsapp:+971501234567" and always
    returns the "whatsapp:" form.
    """
    phone = phone.strip()
    if phone.startswith("whatsapp:"):
        return phone
    return f"whatsapp:{phone}"


def send_whatsapp(to_phone: str, body: str) -> str:
    """Send a WhatsApp message via Twilio REST. Returns the message SID.

    Raises on any Twilio error (not joined, outside the 24h window, etc.) so the
    caller can mark the candidate as 'pending' and log the attempt.
    """
    settings = get_settings()
    if not settings.twilio_whatsapp_from:
        raise RuntimeError("TWILIO_WHATSAPP_FROM must be set to send WhatsApp messages.")

    client = get_twilio()
    message = client.messages.create(
        from_=_to_whatsapp_address(settings.twilio_whatsapp_from),
        to=_to_whatsapp_address(to_phone),
        body=body,
    )
    return message.sid
