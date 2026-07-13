// Brand design tokens — a PLAIN module (no "use client") so both server and client
// components read real values (server components importing a "use client" module get
// undefined for every property across the client boundary).
//
// LANGUAGE: premium SaaS, coloured from the real Caterer.com logo — a charcoal tile
// with ORANGE (the ".com"), PURPLE and YELLOW pictograms. Charcoal is the structural
// ink/dark surface; orange is the primary accent; purple is the secondary accent;
// yellow/gold is a tertiary highlight; a distinct red is the URGENT signal.
//
// NOTE: the token NAMES are legacy (navy/teal/electric/flame) but their VALUES now carry
// the Caterer palette — `navy`=charcoal ink, `teal`=orange (primary), `electric`=purple
// (secondary), `flame`=urgent red. Kept the names so ~all call sites stay valid.
export const brand = {
  // --- Charcoal / ink scale (structure) --------------------------------------
  midnight: "#232325", // darkest charcoal — dark panels / hero
  navy: "#2A2A2D", // charcoal ink — primary text + anchors
  navy800: "#37373A", // raised charcoal surface
  navySheen: "#454548", // lifted charcoal for gradient sheens
  ink: "#242426",

  // --- Primary accent: Caterer orange ----------------------------------------
  teal: "#EF7D00", // PRIMARY accent (Caterer orange) — CTAs, active states
  tealDeep: "#C25F00", // darker end / hover
  tealBright: "#FFA23A", // light orange — gradient light-end + highlights
  tealSoft: "#FDEEDC", // pale orange tint for soft fills
  // --- Secondary accent: Caterer purple --------------------------------------
  electric: "#8A2A8C", // purple — secondary accent, depth, AI/premium touches
  electricDeep: "#6C2170",
  electricSoft: "#F0E1F1", // pale purple tint
  aqua: "#EBD8ED", // legacy alias -> soft purple

  // --- Yellow / gold (tertiary highlight) ------------------------------------
  amber: "#F6A623", // Caterer yellow — highlights / warnings
  gold: "#E7A81C",

  // --- Urgent signal (distinct red so it never blurs with brand orange) ------
  flame: "#EE3B2E",
  flameDeep: "#C42A20",
  flameBright: "#EE3B2E",
  flameBrightSoft: "#FBE0DD",
  flameGlow: "#FF6A52",

  // --- Success (functional) --------------------------------------------------
  herb: "#2E9E67", // "applied!" / available success green
  pay: "#34D171", // money / earnings green — used for all pay figures
  urgent: "#F6A623", // amber — "hot / now" signal (NOT alarm red)

  // --- Surfaces / neutrals (DARK: warm charcoal page, cards lifted above it) --
  base: "#252324", // page background — warm charcoal
  paper: "#FFFFFF", // pure white — kept ONLY for the white search pills
  card: "#302E31", // dark card / raised surface (theme paper), lifted above base
  cardHover: "#383539", // dark card hover
  surfaceAlt: "#2B292C", // tinted dark panel / inset
  cream: "rgba(255,255,255,0.06)", // soft dark chip / inset fill
  line: "rgba(255,255,255,0.10)", // hairline border on dark
  muted: "rgba(255,255,255,0.60)", // secondary text on dark

  // legacy alias kept so older references resolve
  pink: "#F0E1F1",
};

// Material Design 3 token layer (dark scheme), coloured from the Caterer brand.
// Brand orange is kept as the vivid `primary` (branded Material You) with an accessible
// dark on-primary. Surfaces follow the MD3 tonal surface-container model; elevation uses
// MD3's soft ambient shadows. Consumed by theme.ts and MD3-aware components.
export const md = {
  // --- Primary (Caterer orange) ---
  primary: "#EF7D00",
  onPrimary: "#241100",
  primaryContainer: "#7A3D00",
  onPrimaryContainer: "#FFDCC2",
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
  // --- Neutral surfaces (MD3 tonal containers, warm charcoal) ---
  surface: "#252324", // page background — warm charcoal
  surfaceDim: "#1F1D1F",
  surfaceBright: "#403D43",
  surfaceContainerLowest: "#1C1A1C",
  surfaceContainerLow: "#2B292C",
  surfaceContainer: "#302E31",
  surfaceContainerHigh: "#37353A",
  surfaceContainerHighest: "#403D43",
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
  // Primary accent gradient: Caterer orange (CTAs, brand mark).
  accentGradient: `linear-gradient(135deg, ${brand.teal} 0%, ${brand.tealBright} 100%)`,
  // Back-compat alias used by existing call sites.
  tealGradient: `linear-gradient(135deg, ${brand.teal} 0%, ${brand.tealBright} 100%)`,
  // Purple secondary gradient.
  purpleGradient: `linear-gradient(135deg, ${brand.electric} 0%, #B24AB4 100%)`,
  // Urgent red gradient.
  flameGradient: `linear-gradient(135deg, ${brand.flame} 0%, ${brand.flameGlow} 100%)`,
  // Translucent glass panel.
  glass: "rgba(255,255,255,0.72)",
  // Ambient warm depth for backdrops (orange + purple radial lighting).
  aurora: `radial-gradient(115% 85% at 8% -10%, rgba(239,125,0,0.14) 0%, rgba(239,125,0,0) 55%), radial-gradient(110% 80% at 100% -8%, rgba(138,42,140,0.12) 0%, rgba(138,42,140,0) 55%)`,
  // Glow shadows.
  accentGlowShadow: "0 16px 40px -16px rgba(239,125,0,0.5)",
  tealGlowShadow: "0 16px 40px -16px rgba(239,125,0,0.5)",
  flameGlowShadow: "0 14px 34px -14px rgba(238,59,46,0.5)",
  navyGlowShadow: "0 22px 50px -24px rgba(35,35,37,0.5)",
  // Layered card shadows for dark surfaces (depth without a visible halo).
  cardShadow: "0 1px 2px rgba(0,0,0,0.4), 0 10px 26px -14px rgba(0,0,0,0.6)",
  cardShadowHover: "0 2px 6px rgba(0,0,0,0.5), 0 26px 56px -22px rgba(0,0,0,0.72)",
};
