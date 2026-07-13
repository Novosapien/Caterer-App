import type { Job } from "@/lib/types";

// The multi-category filter state behind the gig feed's Filters panel. Every category
// is a multi-select (OR within a category, AND across categories); urgentOnly is a flag.
export type GigFilters = {
  areas: string[];
  roles: string[];
  work: string[];
  pay: string[];
  cuisines: string[];
  settings: string[];
  urgentOnly: boolean;
};

export const EMPTY_FILTERS: GigFilters = {
  areas: [],
  roles: [],
  work: [],
  pay: [],
  cuisines: [],
  settings: [],
  urgentOnly: false,
};

const PAY_LABEL: Record<string, string> = {
  shift: "Per shift",
  hour: "Per hour",
  day: "Per day",
  year: "Annual",
};

// Food type is inferred from the role/title/venue text so it works on real gig data
// without a dedicated cuisine column. Only cuisines that actually match are surfaced.
const CUISINE_MAP: { label: string; keys: string[] }[] = [
  { label: "Japanese", keys: ["sushi", "japanese", "izakaya", "ramen", "nikkei", "teppan", "robata"] },
  { label: "Italian", keys: ["italian", "pizza", "pasta", "trattoria", "pizzaiolo"] },
  { label: "French", keys: ["french", "brasserie", "patissier", "boulanger"] },
  { label: "Indian", keys: ["indian", "tandoor", "curry", "biryani"] },
  { label: "Middle Eastern", keys: ["arabic", "lebanese", "levant", "shawarma", "mezze", "emirati", "persian"] },
  { label: "Steakhouse / Grill", keys: ["steak", "grill", "bbq", "smokehouse", "churrasc", "rotisserie", "meat"] },
  { label: "Seafood", keys: ["seafood", "fish", "oyster", "raw bar", "ceviche"] },
  { label: "Pastry / Bakery", keys: ["pastry", "bakery", "patissier", "baker", "boulanger", "viennoiserie"] },
  { label: "Asian", keys: ["asian", "thai", "chinese", "wok", "dim sum", "vietnamese", "korean", "noodle"] },
  { label: "Mediterranean", keys: ["mediterranean", "greek", "tapas", "spanish", "turkish"] },
];

// Setting / venue type is inferred from the venue name; gigs that match nothing fall
// into "Restaurant" so that bucket is always meaningful.
const SETTING_MAP: { label: string; keys: string[] }[] = [
  { label: "Hotel", keys: ["hotel", "resort", "atlantis", "jumeirah", "address", "palace", "ritz", "four seasons", "marriott", "hilton", "st regis", "fairmont", "mandarin", "kempinski"] },
  { label: "Beach club", keys: ["beach", "nikki", "cove", "bay", "marina", "surf"] },
  { label: "Fine dining", keys: ["fine", "michelin", "signature", "gastro"] },
  { label: "Bar / Lounge", keys: ["rooftop", "sky", "lounge", "bar", "club", "speakeasy"] },
  { label: "Cafe", keys: ["cafe", "café", "coffee", "bistro", "deli", "bakery"] },
  { label: "Events / Catering", keys: ["events", "catering", "banquet", "wedding", "conference"] },
];

const textOf = (job: Job) => `${job.title} ${job.role_type} ${job.venue}`.toLowerCase();

export function cuisinesFor(job: Job): string[] {
  const h = textOf(job);
  return CUISINE_MAP.filter((c) => c.keys.some((k) => h.includes(k))).map((c) => c.label);
}

export function settingsFor(job: Job): string[] {
  const h = `${job.venue} ${job.title}`.toLowerCase();
  const found = SETTING_MAP.filter((s) => s.keys.some((k) => h.includes(k))).map((s) => s.label);
  return found.length ? found : ["Restaurant"];
}

export const workFor = (job: Job) => (job.is_temp ? "Temp / shift" : "Full-time");
export const payLabelFor = (job: Job) => PAY_LABEL[job.pay_unit] ?? job.pay_unit;

export type FilterOptions = {
  areas: string[];
  roles: string[];
  work: string[];
  pay: string[];
  cuisines: string[];
  settings: string[];
};

// Surface only options that exist in the current gig set, so every tick returns results.
export function deriveOptions(gigs: Job[]): FilterOptions {
  const areas = new Set<string>();
  const roles = new Set<string>();
  const work = new Set<string>();
  const pay = new Set<string>();
  const cuisines = new Set<string>();
  const settings = new Set<string>();
  for (const j of gigs) {
    if (j.location_area) areas.add(j.location_area);
    if (j.role_type) roles.add(j.role_type);
    work.add(workFor(j));
    pay.add(payLabelFor(j));
    cuisinesFor(j).forEach((c) => cuisines.add(c));
    settingsFor(j).forEach((s) => settings.add(s));
  }
  const az = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b));
  const WORK_ORDER = ["Temp / shift", "Full-time"];
  const PAY_ORDER = ["Per shift", "Per hour", "Per day", "Annual"];
  return {
    areas: az(areas),
    roles: az(roles),
    work: WORK_ORDER.filter((w) => work.has(w)),
    pay: PAY_ORDER.filter((p) => pay.has(p)),
    cuisines: az(cuisines),
    settings: az(settings),
  };
}

export function matchesFilters(job: Job, f: GigFilters): boolean {
  if (f.urgentOnly && !job.is_urgent) return false;
  if (f.areas.length && !f.areas.includes(job.location_area)) return false;
  if (f.roles.length && !f.roles.includes(job.role_type)) return false;
  if (f.work.length && !f.work.includes(workFor(job))) return false;
  if (f.pay.length && !f.pay.includes(payLabelFor(job))) return false;
  if (f.cuisines.length) {
    const c = cuisinesFor(job);
    if (!f.cuisines.some((x) => c.includes(x))) return false;
  }
  if (f.settings.length) {
    const s = settingsFor(job);
    if (!f.settings.some((x) => s.includes(x))) return false;
  }
  return true;
}

export function countActive(f: GigFilters): number {
  return (
    f.areas.length +
    f.roles.length +
    f.work.length +
    f.pay.length +
    f.cuisines.length +
    f.settings.length +
    (f.urgentOnly ? 1 : 0)
  );
}
