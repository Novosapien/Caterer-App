"""Supabase service-role client.

Uses the service-role key for server-side reads/writes (RLS is permissive in the
prototype but writes go through this client). The client is created lazily and
cached so importing this module never requires live credentials.

Column names here MUST match caterer-dubai/supabase/migrations/0001_schema.sql:
  - jobs(id, title, role_type, description, venue, location_area, pay_aed,
         pay_unit, start_at, dress_code, is_urgent, is_temp, status, ...)
  - candidate_profiles(profile_id, ...)  -- profile_id FK -> profiles(id)
  - profiles(id, role, name, phone, ...)
  - applications(id, job_id, candidate_profile_id, status, source, created_at,
                 updated_at)  -- unique (job_id, candidate_profile_id)
  - whatsapp_threads(thread_key, phone, candidate_profile_id, job_id, status,
                     last_activity_at)
  - whatsapp_messages(id, thread_key, direction, body, created_at)
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from src.config import get_settings

if TYPE_CHECKING:  # pragma: no cover - import only for type hints
    from supabase import Client


@lru_cache(maxsize=1)
def get_supabase() -> "Client":
    """Return a cached Supabase service-role client.

    Imported lazily so the heavy dependency and credentials are only required
    when a request actually needs the database.
    """
    from supabase import create_client

    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to use Supabase."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
