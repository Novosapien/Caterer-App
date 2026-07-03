// Fonts live in a PLAIN module (no "use client") so both the client theme and
// server components (e.g. BrandLogo) can read the font objects. Same client-boundary
// reason as brand.ts — see the note there.
import { Space_Grotesk, DM_Sans } from "next/font/google";

// Display face: geometric, techy, futuristic — carries the brand voice on headings.
export const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

// Body face: clean, highly legible, modern.
export const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});
