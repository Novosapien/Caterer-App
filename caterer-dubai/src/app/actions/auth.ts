"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { setSession, clearSession } from "@/lib/session";
import { HERO_CHEF_ID, DEMO_RECRUITER_ID } from "@/lib/demo";
import type { BusinessType, Role } from "@/lib/types";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

function validateCredentials(email: string, password: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

// Sign the browser in (sets the Supabase auth cookie via the SSR client).
async function signInWithPassword(email: string, password: string): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

// --- Sign up: chef / job seeker --------------------------------------------
export async function signUpChef(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Please enter your name." };
  const invalid = validateCredentials(email, input.password);
  if (invalid) return { ok: false, error: invalid };

  const admin = createServiceClient();
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true, // instant account, no confirmation email
    user_metadata: { name },
  });
  if (authErr || !created.user) {
    const dup = /already been registered|already exists/i.test(authErr?.message ?? "");
    return {
      ok: false,
      error: dup ? "An account with that email already exists." : "Could not create your account.",
    };
  }
  const authUserId = created.user.id;

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .insert({ role: "candidate", name, email, auth_user_id: authUserId })
    .select("id")
    .single();
  if (pErr || !profile) {
    await admin.auth.admin.deleteUser(authUserId); // no orphan auth users
    return { ok: false, error: "Could not set up your profile." };
  }
  await admin.from("candidate_profiles").insert({
    profile_id: profile.id,
    open_to_urgent: true,
    available: true,
    location_area: "Dubai",
  });

  const signInErr = await signInWithPassword(email, input.password);
  if (signInErr) return { ok: false, error: "Account created, but sign-in failed. Try logging in." };
  redirect("/jobs");
}

// --- Sign up: business / recruiter -----------------------------------------
export async function signUpBusiness(input: {
  email: string;
  password: string;
  name: string;
  businessName: string;
  businessType: BusinessType;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const businessName = input.businessName.trim();
  if (!name) return { ok: false, error: "Please enter your name." };
  if (!businessName) return { ok: false, error: "Please enter your business name." };
  const invalid = validateCredentials(email, input.password);
  if (invalid) return { ok: false, error: invalid };

  const admin = createServiceClient();
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authErr || !created.user) {
    const dup = /already been registered|already exists/i.test(authErr?.message ?? "");
    return {
      ok: false,
      error: dup ? "An account with that email already exists." : "Could not create your account.",
    };
  }
  const authUserId = created.user.id;

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .insert({ role: "recruiter", name, email, auth_user_id: authUserId })
    .select("id")
    .single();
  if (pErr || !profile) {
    await admin.auth.admin.deleteUser(authUserId);
    return { ok: false, error: "Could not set up your account." };
  }
  const { data: business, error: bErr } = await admin
    .from("businesses")
    .insert({ name: businessName, type: input.businessType, owner_profile_id: profile.id })
    .select("id")
    .single();
  if (bErr || !business) {
    await admin.auth.admin.deleteUser(authUserId);
    return { ok: false, error: "Could not create your business." };
  }

  // Grant the entry-tier package so a new business can post straight away.
  const { data: starter } = await admin
    .from("packages")
    .select("id")
    .order("price_aed", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (starter) {
    await admin.from("purchases").insert({ business_id: business.id, package_id: starter.id });
  }

  const signInErr = await signInWithPassword(email, input.password);
  if (signInErr) return { ok: false, error: "Account created, but sign-in failed. Try logging in." };
  redirect("/post");
}

// --- Log in (either role) ---------------------------------------------------
export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) return { ok: false, error: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });
  if (error || !data.user) return { ok: false, error: "Invalid email or password." };

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  const role = (profile?.role as Role) ?? "candidate";
  redirect(role === "recruiter" ? "/recruiter" : "/jobs");
}

// --- Form-action wrapper for the auth pages (useActionState) ----------------
// Redirects on success propagate natively through the <form action>; on failure the
// AuthResult flows back to the form for inline error display.
export async function authFormAction(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const mode = String(formData.get("mode") ?? "login");
  const kind = String(formData.get("kind") ?? "chef");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");

  if (mode === "login") return signIn({ email, password });
  if (kind === "business") {
    return signUpBusiness({
      email,
      password,
      name,
      businessName: String(formData.get("businessName") ?? ""),
      businessType: (String(formData.get("businessType") ?? "recruiter") as BusinessType),
    });
  }
  return signUpChef({ email, password, name });
}

// --- Log out (clears both the real auth session and the demo cookie) --------
export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore — still clear the demo cookie below
  }
  await clearSession();
  redirect("/");
}
// Alias kept for existing call sites (RecruiterNav). Must be an async function
// declaration — a "use server" module may only export async functions.
export async function logout() {
  await signOut();
}

// --- Demo personas (kept for quick pitch access) ----------------------------
export async function loginAsChef() {
  await setSession({ profileId: HERO_CHEF_ID, role: "candidate" });
  redirect("/jobs");
}

export async function loginAsRecruiter() {
  await setSession({ profileId: DEMO_RECRUITER_ID, role: "recruiter" });
  redirect("/recruiter");
}

export async function loginAsRecruiterAndPost() {
  await setSession({ profileId: DEMO_RECRUITER_ID, role: "recruiter" });
  redirect("/post");
}
