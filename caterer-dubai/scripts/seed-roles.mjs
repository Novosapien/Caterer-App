// Adds a broad spread of hospitality roles (front of house, bar/mixology, management,
// and other kitchen/restaurant roles) to the live gig catalogue so the marketplace
// reads as a full hospitality jobs board, not chef-only.
// Run: node --env-file=.env.local scripts/seed-roles.mjs   (idempotent — skips if already added)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const B = (n) => `aaaaaaaa-0000-0000-0000-00000000000${n}`;
const hrs = (h) => new Date(Date.now() + h * 3600_000).toISOString();

// [business, title, role_type, description, venue, area, pay, unit, offsetHours, dress, urgent, temp]
const rows = [
  // Front of house / waiting
  [3, "Restaurant Host", "Host", "Greet, seat and manage guest flow at a waterfront fine-dining venue.", "Bluewaters Island", "Bluewaters", 190, "shift", 6, "Smart black", false, true],
  [1, "Food Runner", "Runner", "Expedite dishes from pass to floor during a high-volume brunch.", "Atlantis The Palm", "Palm Jumeirah", 150, "shift", 9, "All black", true, true],
  [4, "Maitre d'", "Maitre d'", "Lead front of house for a high-profile private dinner in DIFC.", "DIFC Fine Dining", "DIFC", 380, "shift", 30, "Black tie", false, true],
  [3, "Waiter / Waitress (fine dining)", "Waiter", "Silver-service a la carte at a Michelin-style restaurant.", "Address Downtown", "Downtown Dubai", 210, "shift", 26, "Black tie", false, true],
  // Bar / mixology
  [1, "Mixologist", "Mixologist", "Craft signature cocktails at a rooftop brand-launch party.", "Atlantis The Palm", "Palm Jumeirah", 300, "shift", 7, "All black", true, true],
  [5, "Head Bartender", "Bartender", "Run the bar team across a busy beach-club weekend.", "Nikki Beach", "JBR", 320, "shift", 28, "All black", false, true],
  [5, "Bar Back", "Bar Back", "Keep the bar stocked, iced and running during a festival.", "Palm Catering event", "JBR", 130, "shift", 10, "All black", true, true],
  [4, "Sommelier", "Sommelier", "Wine pairing and service for a six-course degustation dinner.", "DIFC Fine Dining", "DIFC", 420, "shift", 50, "Business formal", false, true],
  // Management
  [3, "Restaurant Manager", "Manager", "Cover a 120-cover restaurant for a relief week: floor leadership and service standards.", "Address Downtown", "Business Bay", 850, "day", 48, "Business formal", false, true],
  [5, "Bar Manager", "Manager", "Own bar operations for a two-week pop-up concept.", "City Walk pop-up", "City Walk", 780, "day", 72, "Smart casual", false, false],
  [2, "Events Manager", "Manager", "Run a 400-guest corporate gala end to end.", "Madinat Jumeirah", "Umm Suqeim", 920, "day", 60, "Business formal", false, false],
  [3, "F&B Supervisor", "Supervisor", "Supervise floor and bar teams for a hotel banquet.", "Address Downtown", "Downtown Dubai", 300, "shift", 12, "Black tie", true, true],
  // Wider kitchen / restaurant
  [5, "Tandoor Chef", "Chef de Partie", "Live tandoor station for a 300-guest Indian wedding.", "Al Barsha Banqueting", "Al Barsha", 290, "shift", 33, "Chef whites", false, true],
  [3, "Kitchen Steward", "Steward", "Wash-up, hygiene and pot-wash for a large banquet service.", "Address Downtown", "Downtown Dubai", 120, "shift", 8, "Kitchen kit", true, true],
  [1, "Pizza Chef", "Chef de Partie", "Wood-fired pizza station at a family beach festival.", "Atlantis The Palm", "Palm Jumeirah", 240, "shift", 34, "Chef whites", false, true],
];

const { data: existing } = await db.from("jobs").select("id").eq("title", "Mixologist").limit(1);
if (existing && existing.length > 0) {
  console.log("Broader roles already seeded (found 'Mixologist'). Skipping.");
  process.exit(0);
}

const payload = rows.map((r) => ({
  business_id: B(r[0]),
  title: r[1],
  role_type: r[2],
  description: r[3],
  venue: r[4],
  location_area: r[5],
  pay_aed: r[6],
  pay_unit: r[7],
  start_at: hrs(r[8]),
  dress_code: r[9],
  is_urgent: r[10],
  is_temp: r[11],
  status: "open",
}));

const { error } = await db.from("jobs").insert(payload);
if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}
console.log(`Inserted ${payload.length} roles across FOH, bar/mixology, management and kitchen.`);
process.exit(0);
