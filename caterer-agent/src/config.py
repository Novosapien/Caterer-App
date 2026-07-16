"""Runtime configuration for the WhatsApp Gig Agent service.

Settings are read lazily from the environment (see `.env.example`) so that the
module can be imported without live credentials — the service only needs the
values at request time. Use `get_settings()` everywhere; it caches a single
Settings instance.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed configuration.

    All fields have safe defaults where a missing value would not prevent import.
    Credential fields default to empty strings so the process can start (and
    `/health` can respond) without them; endpoints that need a credential fail
    per-request rather than at import time.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Anthropic / model ---------------------------------------------------
    anthropic_api_key: str = ""
    # Claude Sonnet 5 (resolves to the latest Sonnet). Overridable via env.
    anthropic_model: str = "claude-sonnet-5"

    # --- Unipile (the sole WhatsApp transport) ------------------------------
    # A real WhatsApp account connected via QR, so business-initiated first
    # messages are freeform (no template approval). DSN is the per-account
    # host:port from the Unipile dashboard, e.g. "api8.unipile.com:13851";
    # plus the API key and the connected WhatsApp account id.
    unipile_dsn: str = ""
    unipile_api_key: str = ""
    unipile_account_id: str = ""

    # --- Supabase ------------------------------------------------------------
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    # Postgres connection string for the LangGraph checkpointer.
    supabase_db_url: str = ""

    # --- Service auth --------------------------------------------------------
    notify_shared_secret: str = ""

    # --- Optional observability ---------------------------------------------
    langsmith_api_key: str = ""


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance (read from the environment lazily)."""
    return Settings()
