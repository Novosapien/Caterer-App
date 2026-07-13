// Fonts live in a PLAIN module (no "use client") so both the client theme and
// server components (e.g. BrandLogo) can read the font objects. Same client-boundary
// reason as brand.ts — see the note there.
import { Geist } from "next/font/google";

// One family throughout — Geist (Vercel's crisp, technical sans). Display uses the
// heavier weights for headings; body carries the full range. Both resolve to Geist,
// so headings and copy share a single, contemporary typographic voice.
export const display = Geist({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

// Body face: same family, full weight range for copy and UI.
export const body = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});
