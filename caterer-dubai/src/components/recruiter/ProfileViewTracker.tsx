"use client";

import { useEffect, useRef } from "react";
import { notifyRecruiterViewedProfile } from "@/app/(recruiter)/actions";

// Fires the Tier-3 progressive-profiling trigger once per mount: when a recruiter
// opens a candidate's profile, write a "recruiter viewed your profile" notification.
// Client-side (in an effect) so it runs exactly on a real view, not on every
// server prerender/revalidation.
export default function ProfileViewTracker({ candidateProfileId }: { candidateProfileId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void notifyRecruiterViewedProfile(candidateProfileId);
  }, [candidateProfileId]);
  return null;
}
