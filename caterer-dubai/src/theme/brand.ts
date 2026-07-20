// Brand design tokens — a PLAIN module (no "use client") so both server and client
// components read real values (server components importing a "use client" module get
// undefined for every property across the client boundary).
//
// LANGUAGE: premium SaaS, coloured from the real Caterer.com logo — a charcoal tile
// with ORANGE (the ".com"), PURPLE and YELLOW pictograms. Charcoal is the structural
// ink/dark surface; the logo PURPLE (#924199) is the primary accent; yellow/gold is a
// tertiary highlight; a distinct red is the URGENT signal.
//
// NOTE: the token NAMES are legacy (navy/teal/electric/flame) but their VALUES now carry
// the Caterer palette — `navy`=charcoal ink, `teal`=purple (primary), `electric`=purple
// (secondary), `flame`=urgent red. Kept the names so ~all call sites stay valid.
//
// The purple scale is built on the logo purple's hue (~295°): the base is used for FILLS
// (buttons, gradients) with WHITE text on top, and `tealBright` is the on-dark accent for
// text/icons — the base purple is too dark to read as text on the near-black page.
export const brand = {
  // --- Charcoal / ink scale (structure) --------------------------------------
  midnight: "#232325", // darkest charcoal — dark panels / hero
  navy: "#2A2A2D", // charcoal ink — primary text + anchors
  navy800: "#37373A", // raised charcoal surface
  navySheen: "#454548", // lifted charcoal for gradient sheens
  ink: "#242426",

  // --- Primary accent: Caterer purple (straight off the logo) -----------------
  teal: "#924199", // PRIMARY accent (logo purple) — CTAs, active states. White text on it.
  tealDeep: "#703276", // darker end / hover
  tealBright: "#C273CA", // light purple — gradient light-end + accent text/icons on dark
  tealSoft: "#F5E9F7", // pale purple tint for soft fills
  // --- Secondary accent: Caterer purple --------------------------------------
  electric: "#8A2A8C", // purple — secondary accent, depth, AI/premium touches
  electricDeep: "#6C2170",
  electricSoft: "#F0E1F1", // pale purple tint
  aqua: "#EBD8ED", // legacy alias -> soft purple

  // --- Yellow / gold (tertiary highlight) ------------------------------------
  amber: "#F6A623", // Caterer yellow — highlights / warnings
  gold: "#E7A81C",

  // --- Urgent signal (distinct red so it never blurs with brand purple) ------
  flame: "#EE3B2E",
  flameDeep: "#C42A20",
  flameBright: "#EE3B2E",
  flameBrightSoft: "#FBE0DD",
  flameGlow: "#FF6A52",

  // --- Success (functional) --------------------------------------------------
  herb: "#2E9E67", // "applied!" / available success green
  pay: "#34D171", // money / earnings green — used for all pay figures
  urgent: "#F6A623", // amber — "hot / now" signal (NOT alarm red)

  // --- Surfaces / neutrals (DARK: near-black page, cards lifted above it) ------
  base: "#08080A", // page background — near-black (matches the landing)
  paper: "#FFFFFF", // pure white — kept ONLY for the white search pills
  card: "#16161A", // dark card / raised surface (theme paper), lifted above base
  cardHover: "#1F1F23", // dark card hover
  surfaceAlt: "#141416", // tinted dark panel / inset
  cream: "rgba(255,255,255,0.06)", // soft dark chip / inset fill
  line: "rgba(255,255,255,0.10)", // hairline border on dark
  muted: "rgba(255,255,255,0.60)", // secondary text on dark

  // legacy alias kept so older references resolve
  pink: "#F0E1F1",
};

// Material Design 3 token layer (dark scheme), coloured from the Caterer brand.
// The logo purple is the `primary` (branded Material You) with a white on-primary for
// contrast. Surfaces follow the MD3 tonal surface-container model; elevation uses
// MD3's soft ambient shadows. Consumed by theme.ts and MD3-aware components.
export const md = {
  // --- Primary (Caterer purple) ---
  // onPrimary is WHITE: the logo purple is dark (contrast 6.1:1 with white, but only
  // 3.0:1 with the near-black used for orange), so dark-on-primary would fail AA.
  primary: "#924199",
  onPrimary: "#FFFFFF",
  primaryContainer: "#5E2862",
  onPrimaryContainer: "#F5D9F7",
  // --- Secondary (Caterer purple) ---
  secondary: "#D48BD6",
  onSecondary: "#40103F",
  secondaryContainer: "#5C2A5D",
  onSecondaryContainer: "#F7D9F6",
  // --- Tertiary (gold / amber) ---
  tertiary: "#F6A623",
  onTertiary: "#3E2900",
  tertiaryContainer: "#5A3E00",
  onTertiaryContainer: "#FFE0A3",
  // --- Error ---
  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#93000A",
  onErrorContainer: "#FFDAD6",
  // --- Neutral surfaces (MD3 tonal containers, near-black) ---
  surface: "#08080A", // page background — near-black (matches the landing)
  surfaceDim: "#060608",
  surfaceBright: "#2A2A2E",
  surfaceContainerLowest: "#050506",
  surfaceContainerLow: "#141416",
  surfaceContainer: "#17171A",
  surfaceContainerHigh: "#1F1F23",
  surfaceContainerHighest: "#27272B",
  onSurface: "#E7E1E6",
  onSurfaceVariant: "#CBC4CE",
  outline: "#958F99",
  outlineVariant: "rgba(255,255,255,0.12)",
  // --- MD3 shape scale (corner radii, px) ---
  shape: { xs: 4, sm: 8, md: 12, lg: 16, xl: 28, full: 999 },
  // --- MD3 state-layer opacities ---
  state: { hover: 0.08, focus: 0.1, pressed: 0.1, dragged: 0.16 },
  // --- MD3 elevation (soft ambient shadows, levels 0-5) ---
  elevation: [
    "none",
    "0 1px 2px rgba(0,0,0,0.30), 0 1px 3px 1px rgba(0,0,0,0.15)",
    "0 1px 2px rgba(0,0,0,0.30), 0 2px 6px 2px rgba(0,0,0,0.15)",
    "0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.30)",
    "0 6px 10px 4px rgba(0,0,0,0.15), 0 2px 3px rgba(0,0,0,0.30)",
    "0 8px 12px 6px rgba(0,0,0,0.15), 0 4px 4px rgba(0,0,0,0.30)",
  ],
};

// Reusable gradients, glows and glass — the premium surface language.
export const surfaces = {
  // Dark: charcoal with a diagonal sheen (app bar, dark panels, hero).
  navyGradient: `linear-gradient(135deg, ${brand.midnight} 0%, #2E2E31 55%, ${brand.navy800} 100%)`,
  // Primary accent gradient: Caterer purple (CTAs, brand mark).
  accentGradient: `linear-gradient(135deg, ${brand.teal} 0%, ${brand.tealBright} 100%)`,
  // Back-compat alias used by existing call sites.
  tealGradient: `linear-gradient(135deg, ${brand.teal} 0%, ${brand.tealBright} 100%)`,
  // Purple secondary gradient.
  purpleGradient: `linear-gradient(135deg, ${brand.electric} 0%, #B24AB4 100%)`,
  // Urgent red gradient.
  flameGradient: `linear-gradient(135deg, ${brand.flame} 0%, ${brand.flameGlow} 100%)`,
  // Translucent glass panel.
  glass: "rgba(255,255,255,0.72)",
  // Ambient depth for backdrops (purple radial lighting).
  aurora: `radial-gradient(115% 85% at 8% -10%, rgba(146,65,153,0.14) 0%, rgba(146,65,153,0) 55%), radial-gradient(110% 80% at 100% -8%, rgba(138,42,140,0.12) 0%, rgba(138,42,140,0) 55%)`,
  // Glow shadows.
  accentGlowShadow: "0 16px 40px -16px rgba(146,65,153,0.5)",
  tealGlowShadow: "0 16px 40px -16px rgba(146,65,153,0.5)",
  flameGlowShadow: "0 14px 34px -14px rgba(238,59,46,0.5)",
  navyGlowShadow: "0 22px 50px -24px rgba(35,35,37,0.5)",
  // Layered card shadows for dark surfaces (depth without a visible halo).
  cardShadow: "0 1px 2px rgba(0,0,0,0.4), 0 10px 26px -14px rgba(0,0,0,0.6)",
  cardShadowHover: "0 2px 6px rgba(0,0,0,0.5), 0 26px 56px -22px rgba(0,0,0,0.72)",
};
