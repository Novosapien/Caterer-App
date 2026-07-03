"use server";

import { redirect } from "next/navigation";
import { setSession, clearSession } from "@/lib/session";
import { HERO_CHEF_ID, DEMO_RECRUITER_ID } from "@/lib/demo";

export async function loginAsChef() {
  await setSession({ profileId: HERO_CHEF_ID, role: "candidate" });
  redirect("/jobs");
}

export async function loginAsRecruiter() {
  await setSession({ profileId: DEMO_RECRUITER_ID, role: "recruiter" });
  redirect("/recruiter");
}

// Low-friction "Post a job" entry: sign in as the demo recruiter and go straight
// to the post form.
export async function loginAsRecruiterAndPost() {
  await setSession({ profileId: DEMO_RECRUITER_ID, role: "recruiter" });
  redirect("/post");
}

export async function logout() {
  await clearSession();
  redirect("/");
}
