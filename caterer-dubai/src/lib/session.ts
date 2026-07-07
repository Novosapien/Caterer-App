import { cookies } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Role } from "./types";

// Identity resolution. Real accounts come from Supabase Auth (email + password); the demo
// cookie is a fallback for the 1-tap personas and guest quick-apply; null = anonymous
// browsing (the landing, gig feed and gig pages are all public).

const COOKIE = "caterer_session";

export interface Session {
  profileId: string;
  role: Role;
}

export async function getSession(): Promise<Session | null> {
  // 1) Real Supabase Auth session → resolve the linked profile.
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const db = createServiceClient();
      const { data: profile } = await db
        .from("profiles")
        .select("id, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (profile) return { profileId: profile.id as string, role: profile.role as Role };
    }
  } catch {
    // Auth unavailable or token invalid — fall through to the demo cookie.
  }

  // 2) Demo cookie (personas + guest quick-apply).
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

// Demo/guest cookie writers — kept for the 1-tap personas and the phone-first guest apply.
export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
