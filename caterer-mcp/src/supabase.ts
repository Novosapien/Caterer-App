import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The chef this MCP session acts as. In a demo we default to Yusuf Rahman; in a real
// deployment each user would run the server with their own CATERER_PROFILE_ID.
export const PROFILE_ID =
  process.env.CATERER_PROFILE_ID ?? "11111111-1111-1111-1111-111111111111";

let cached: SupabaseClient | null = null;

// Service-role client — bypasses RLS. This is a trusted local process (stdio MCP),
// same trust model as the app's server actions.
export function db(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env and fill them in.",
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
