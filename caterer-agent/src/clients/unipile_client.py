"""Unipile client for WhatsApp send/reply (the sole WhatsApp transport).

Unipile connects a real WhatsApp account (via QR) and exposes a unified REST API.
Business-initiated first messages are freeform (no template), which is exactly
what the urgent-gig invite needs.

API (verified against developer.unipile.com):
  - Start a new chat + first message:  POST {base}/api/v1/chats
      body: { account_id, attendees_ids: ["<digits>@s.whatsapp.net"], text }
  - Reply in an existing chat:         POST {base}/api/v1/chats/{chat_id}/messages
      body: { text }
  Auth header: X-API-KEY. Base URL derives from UNIPILE_DSN (host:port).

Env: UNIPILE_DSN, UNIPILE_API_KEY, UNIPILE_ACCOUNT_ID.
"""

from __future__ import annotations

import re

import requests

from src.config import get_settings

_TIMEOUT_S = 20


def _base_url() -> str:
    dsn = get_settings().unipile_dsn.strip().rstrip("/")
    if not dsn:
        raise RuntimeError("UNIPILE_DSN must be set to use Unipile.")
    if not dsn.startswith("http"):
        dsn = f"https://{dsn}"
    return dsn


def _headers() -> dict:
    key = get_settings().unipile_api_key
    if not key:
        raise RuntimeError("UNIPILE_API_KEY must be set to use Unipile.")
    return {
        "X-API-KEY": key,
        "accept": "application/json",
        "content-type": "application/json",
    }


def wa_attendee(phone: str) -> str:
    """E.164 phone -> WhatsApp provider id ("971501234567@s.whatsapp.net")."""
    digits = re.sub(r"\D", "", phone or "")
    return f"{digits}@s.whatsapp.net"


def provider_id_to_e164(provider_id: str) -> str:
    """Inbound "971501234567@s.whatsapp.net" (or bare digits) -> "+971501234567"."""
    digits = re.sub(r"\D", "", str(provider_id or ""))
    return f"+{digits}" if digits else ""


def send_new_whatsapp(to_phone: str, body: str) -> str:
    """Start a new WhatsApp chat and send the first message. Returns the chat_id.

    Raises on any error so the caller can mark the candidate 'pending' and log it.
    """
    settings = get_settings()
    if not settings.unipile_account_id:
        raise RuntimeError("UNIPILE_ACCOUNT_ID must be set to send WhatsApp messages.")

    payload = {
        "account_id": settings.unipile_account_id,
        "attendees_ids": [wa_attendee(to_phone)],
        "text": body,
    }
    resp = requests.post(
        f"{_base_url()}/api/v1/chats", headers=_headers(), json=payload, timeout=_TIMEOUT_S
    )
    resp.raise_for_status()
    data = resp.json() if resp.content else {}
    # Defensive: response has carried chat_id under a couple of shapes historically.
    return str(data.get("chat_id") or data.get("id") or "")


def reply_in_chat(chat_id: str, body: str) -> None:
    """Send a message into an existing chat (used to reply to inbound)."""
    if not chat_id:
        raise RuntimeError("reply_in_chat requires a chat_id.")
    resp = requests.post(
        f"{_base_url()}/api/v1/chats/{chat_id}/messages",
        headers=_headers(),
        json={"text": body},
        timeout=_TIMEOUT_S,
    )
    resp.raise_for_status()
