import { cookies } from "next/headers";
import type { Role } from "./types";

// Demo-grade session: a cookie holding {profileId, role}. This stands in for full
// Supabase Auth so the clickable demo's 1-tap personas + phone-first apply work without
// provisioning a phone/SMS provider. (Fidelity: "clickable demo, simulated data".)

const COOKIE = "caterer_session";

export interface Session {
  profileId: string;
  role: Role;
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

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
