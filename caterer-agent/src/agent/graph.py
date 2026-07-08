"""LangGraph agent: create_react_agent + Postgres checkpointer.

The agent is a single conversational message+tool loop (Claude Sonnet 5 via
langchain-anthropic). Conversation history is persisted by the LangGraph Postgres
checkpointer, keyed by thread_id = thread_key, so history reloads automatically
across messages (no hand-rolled history).

Per turn the webhook handler:
  1. resolves the thread + loads gig/candidate context,
  2. builds tools with the ids INJECTED (closure) so the LLM emits no ids,
  3. builds a fresh react agent bound to those tools + this turn's system prompt,
  4. invokes it with thread_id=thread_key and the inbound message.

The checkpointer is created lazily and cached; importing this module requires no
credentials.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Optional

from src.agent.context import ConversationContext
from src.agent.prompts import build_system_prompt
from src.agent.tools import build_tools
from src.config import get_settings

logger = logging.getLogger("caterer_agent")


# ---------------------------------------------------------------------------
# Model + checkpointer (lazy, cached)
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def _get_model():
    """Build the ChatAnthropic model (Claude Sonnet 5). Lazy + cached."""
    from langchain_anthropic import ChatAnthropic

    settings = get_settings()
    # Note: newer Claude models (Sonnet 5+) reject an explicit `temperature`, so
    # we do not set it and let the model use its default.
    return ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key or None,
        max_tokens=1024,
    )


# Module-level singletons for the Postgres checkpointer connection + object.
# The langgraph-checkpoint-postgres saver holds a live connection, so it is set
# up once via `setup_checkpointer()` at service startup and reused per request.
_checkpointer = None
_checkpointer_cm = None


def setup_checkpointer():
    """Open the Postgres checkpointer and run its migrations. Idempotent.

    Returns the checkpointer instance. Called once at FastAPI startup; safe to
    call again (returns the existing instance).
    """
    global _checkpointer, _checkpointer_cm
    if _checkpointer is not None:
        return _checkpointer

    from langgraph.checkpoint.postgres import PostgresSaver

    settings = get_settings()
    if not settings.supabase_db_url:
        raise RuntimeError(
            "SUPABASE_DB_URL must be set to use the Postgres checkpointer."
        )

    # PostgresSaver.from_conn_string returns a context manager yielding the saver.
    _checkpointer_cm = PostgresSaver.from_conn_string(settings.supabase_db_url)
    _checkpointer = _checkpointer_cm.__enter__()
    _checkpointer.setup()  # create checkpoint tables if absent
    return _checkpointer


def teardown_checkpointer() -> None:
    """Close the checkpointer connection (called at FastAPI shutdown)."""
    global _checkpointer, _checkpointer_cm
    if _checkpointer_cm is not None:
        try:
            _checkpointer_cm.__exit__(None, None, None)
        finally:
            _checkpointer_cm = None
            _checkpointer = None


def get_checkpointer():
    """Return the active checkpointer, setting it up on first use."""
    if _checkpointer is None:
        return setup_checkpointer()
    return _checkpointer


def reset_checkpointer() -> None:
    """Drop the cached checkpointer so the next use reconnects (best-effort close).

    Supabase closes idle Postgres connections, which leaves the single cached
    connection dead ("server closed the connection unexpectedly"). Clearing the
    globals forces the next get_checkpointer() to open a fresh connection.
    """
    global _checkpointer, _checkpointer_cm
    cm = _checkpointer_cm
    _checkpointer = None
    _checkpointer_cm = None
    if cm is not None:
        try:
            cm.__exit__(None, None, None)
        except Exception:  # pragma: no cover - the connection is already broken
            pass


# ---------------------------------------------------------------------------
# Per-turn agent construction + invocation
# ---------------------------------------------------------------------------


def _build_agent(job_id: str, candidate_profile_id: str, system_prompt: str):
    """Build a react agent bound to this turn's ids (tools) + checkpointer.

    The model is shared; tools carry the injected ids; the checkpointer persists
    per-thread history. The system prompt is passed via `prompt=` so it is applied
    at model-call time and NOT stored in the persisted message history — otherwise
    each turn would stack another system message and Anthropic rejects multiple
    non-consecutive system messages.
    """
    from langgraph.prebuilt import create_react_agent

    tools = build_tools(job_id, candidate_profile_id)
    return create_react_agent(
        _get_model(),
        tools=tools,
        prompt=system_prompt,
        checkpointer=get_checkpointer(),
    )


def _is_conn_error(exc: BaseException) -> bool:
    """True if the exception (or its cause) is a dropped-Postgres-connection error.

    Matches psycopg OperationalError/InterfaceError by class name and the tell-tale
    "server closed the connection" / "connection is closed" messages, walking the
    __cause__/__context__ chain since the saver may wrap it.
    """
    seen = set()
    cur: Optional[BaseException] = exc
    while cur is not None and id(cur) not in seen:
        seen.add(id(cur))
        name = type(cur).__name__
        msg = str(cur).lower()
        if name in ("OperationalError", "InterfaceError") or (
            "server closed the connection" in msg or "connection is closed" in msg
        ):
            return True
        cur = cur.__cause__ or cur.__context__
    return False


def _extract_reply_text(result: dict) -> str:
    """Pull the final assistant text from a create_react_agent result."""
    messages = result.get("messages", []) if isinstance(result, dict) else []
    for message in reversed(messages):
        # AIMessage with plain string content is the reply we want.
        content = getattr(message, "content", None)
        msg_type = getattr(message, "type", None)
        if msg_type == "ai" and content:
            if isinstance(content, str):
                return content.strip()
            # Content can be a list of blocks; join text blocks.
            parts = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(block.get("text", ""))
                elif isinstance(block, str):
                    parts.append(block)
            joined = "".join(parts).strip()
            if joined:
                return joined
    return ""


def run_turn(
    *,
    thread_key: str,
    job_id: str,
    candidate_profile_id: str,
    context: ConversationContext,
    inbound_text: str,
) -> str:
    """Run one conversational turn and return the agent's reply text.

    thread_id = thread_key so the checkpointer restores this thread's history.
    The system prompt is rebuilt from the freshly-loaded gig/candidate context;
    only the new human message is passed in (history comes from the checkpointer).
    """
    system_prompt = build_system_prompt(context)
    agent = _build_agent(job_id, candidate_profile_id, system_prompt)

    config = {"configurable": {"thread_id": thread_key}}
    # Only the new human message goes in the payload; the system prompt is applied
    # via prompt= (not persisted), and prior turns come from the checkpointer.
    payload = {"messages": [{"role": "user", "content": inbound_text}]}

    try:
        result = agent.invoke(payload, config=config)
    except Exception as exc:
        # The checkpointer holds a single Postgres connection that Supabase drops
        # when idle. On a connection-level failure, reconnect once and retry so a
        # stale connection self-heals instead of failing the turn.
        if _is_conn_error(exc):
            logger.warning("Checkpointer connection lost (%s); reconnecting and retrying.", exc)
            reset_checkpointer()
            agent = _build_agent(job_id, candidate_profile_id, system_prompt)
            result = agent.invoke(payload, config=config)
        else:
            raise
    reply = _extract_reply_text(result)
    if not reply:
        reply = (
            "Sorry, I hit a snag just now — could you send that again in a moment?"
        )
    return reply


def build_invite_message(context: ConversationContext) -> str:
    """Build the initial outbound WhatsApp invite for /notify (first message).

    A short warm pitch grounded in the gig facts. This is the first
    whatsapp_messages 'out' row and seeds the conversation before the chef replies.
    """
    gig = context.gig
    candidate = context.candidate
    name = candidate.name or "there"
    role = gig.role_type or gig.title or "a catering shift"
    venue = gig.venue or "a Dubai venue"

    bits = [f"Hi {name}! Urgent gig: {role} at {venue}"]
    if gig.location_area:
        bits.append(f"({gig.location_area})")
    if gig.pay_aed is not None:
        pay_amount = int(gig.pay_aed) if float(gig.pay_aed).is_integer() else gig.pay_aed
        unit = gig.pay_unit or "shift"
        bits.append(f"— AED {pay_amount} per {unit}")
    pitch = " ".join(bits).strip()

    extras = []
    if gig.start_at:
        extras.append(f"Starts {gig.start_at}.")
    if gig.dress_code:
        extras.append(f"Dress: {gig.dress_code}.")
    tail = (" " + " ".join(extras)) if extras else ""

    return f"{pitch}.{tail} Can you take it? 🔥"
