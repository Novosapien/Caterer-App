import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnedBusinessId } from "@/lib/queries";

// Model A ("one login, multiple hats"): any signed-in user can post a gig, including a
// chef offering a private gig. If their profile doesn't own a business yet, provision a
// lightweight poster identity on the fly — named after them, typed as events/catering
// (the closest allowed business type), and seeded with the entry-tier package so they
// can post straight away. Idempotent: returns the existing business id if one exists,
// so this never creates duplicates and needs no separate "become a business" step.
export async function ensurePosterBusiness(profileId: string): Promise<string | null> {
  const existing = await getOwnedBusinessId(profileId);
  if (existing) return existing;

  const db = createServiceClient();

  const { data: profile } = await db
    .from("profiles")
    .select("name")
    .eq("id", profileId)
    .maybeSingle();
  const name = (profile?.name as string | undefined)?.trim() || "Private poster";

  const { data: business, error } = await db
    .from("businesses")
    .insert({ name, type: "eventing", owner_profile_id: profileId })
    .select("id")
    .single();
  if (error || !business) return null;

  // Grant the entry-tier package so a brand-new poster can post immediately, mirroring
  // what a full business signup gets.
  const { data: starter } = await db
    .from("packages")
    .select("id")
    .order("price_aed", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (starter) {
    await db.from("purchases").insert({ business_id: business.id, package_id: starter.id });
  }

  return business.id as string;
}
