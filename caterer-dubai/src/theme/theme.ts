"use client";

import { createTheme } from "@mui/material/styles";
import { brand, surfaces } from "./brand";
import { display, body } from "./fonts";

// Re-exported for existing `import { brand } from "@/theme/theme"` call sites.
// Prefer importing from "@/theme/brand" directly in server components.
export { brand };

// Teal is the primary brand colour. We keep `teal` AND `flame` as first-class
// palette colours so <Button color="teal"> / color="flame" work reliably (an sx
// bgcolor override can lose to the variant colour under SSR). `teal` is kept as an
// explicit alias of primary so existing color="teal" usages stay correct.
declare module "@mui/material/styles" {
  interface Palette {
    teal: Palette["primary"];
    flame: Palette["primary"];
  }
  interface PaletteOptions {
    teal?: PaletteOptions["primary"];
    flame?: PaletteOptions["primary"];
  }
}
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    teal: true;
    flame: true;
  }
}
declare module "@mui/material/SvgIcon" {
  interface SvgIconPropsColorOverrides {
    teal: true;
    flame: true;
  }
}

// Type system: Space Grotesk (display / headings — techy, futuristic, brand voice)
// paired with DM Sans (body — clean, legible). Navy + flame TJ palette retained.
const displayFont = display.style.fontFamily;

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "dark",
    // Caterer orange is the primary accent.
    primary: { main: brand.teal, dark: brand.tealDeep, contrastText: "#FFFFFF" },
    secondary: { main: brand.electric, dark: brand.electricDeep, contrastText: "#FFFFFF" },
    // `teal` mirrors primary so existing color="teal" usages stay intact.
    teal: { main: brand.teal, dark: brand.tealDeep, contrastText: "#FFFFFF" },
    // `flame` is the URGENT signal colour only.
    flame: { main: brand.flame, dark: brand.flameDeep, contrastText: "#FFFFFF" },
    warning: { main: brand.amber, contrastText: "#241a06" },
    // Shiny-black language from the search page: near-black canvas, dark cards.
    background: { default: brand.base, paper: brand.card },
    text: { primary: "#FFFFFF", secondary: brand.muted },
    divider: brand.line,
  },
  typography: {
    fontFamily: body.style.fontFamily,
    h1: { fontFamily: displayFont, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.0 },
    h2: { fontFamily: displayFont, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.04 },
    h3: { fontFamily: displayFont, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.06 },
    h4: { fontFamily: displayFont, fontWeight: 700, letterSpacing: "-0.025em" },
    h5: { fontFamily: displayFont, fontWeight: 600, letterSpacing: "-0.02em" },
    h6: { fontFamily: displayFont, fontWeight: 600, letterSpacing: "-0.015em" },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
    button: { fontWeight: 700, textTransform: "none", letterSpacing: "0.005em" },
    subtitle2: { fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: "0.72rem" },
    overline: { fontWeight: 700, letterSpacing: "0.16em" },
  },
  shape: { borderRadius: 14 },
  // Soft, layered, navy-tinted elevation (Stripe/Linear feel) rather than heavy drops.
  shadows: [
    "none",
    "0 1px 2px rgba(38,36,40,0.05), 0 4px 12px -4px rgba(38,36,40,0.10)",
    "0 1px 2px rgba(38,36,40,0.05), 0 10px 26px -10px rgba(38,36,40,0.14)",
    "0 2px 4px rgba(38,36,40,0.05), 0 18px 40px -16px rgba(38,36,40,0.18)",
    "0 2px 6px rgba(38,36,40,0.06), 0 28px 60px -22px rgba(38,36,40,0.22)",
    ...Array(20).fill("0 2px 6px rgba(38,36,40,0.06), 0 32px 70px -24px rgba(38,36,40,0.24)"),
  ] as unknown as ReturnType<typeof createTheme>["shadows"],
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: 12,
          paddingInline: 20,
          paddingBlock: 10,
          fontWeight: 700,
          transition: "transform .18s cubic-bezier(.2,.7,.3,1), box-shadow .24s ease, background-color .22s ease, border-color .2s ease",
          "&:active": { transform: "scale(0.98)" },
          // Contained CTAs: premium electric->cyan gradient with a soft glow + hover lift.
          ...(ownerState.variant === "contained" &&
            (ownerState.color === "primary" || ownerState.color === "teal") && {
              background: surfaces.accentGradient,
              boxShadow: "0 10px 24px -12px rgba(239,125,0,0.5)",
              "&:hover": { boxShadow: "0 16px 34px -12px rgba(239,125,0,0.65)", transform: "translateY(-1px)" },
            }),
          ...(ownerState.variant === "contained" &&
            ownerState.color === "secondary" && {
              background: `linear-gradient(135deg, ${brand.electric} 0%, ${brand.electricDeep} 100%)`,
              boxShadow: "0 10px 24px -12px rgba(138,42,140,0.5)",
              "&:hover": { boxShadow: "0 16px 34px -12px rgba(138,42,140,0.65)", transform: "translateY(-1px)" },
            }),
          ...(ownerState.variant === "contained" &&
            ownerState.color === "flame" && {
              background: surfaces.flameGradient,
              boxShadow: "0 10px 24px -12px rgba(238,59,46,0.55)",
              "&:hover": { boxShadow: "0 16px 34px -12px rgba(238,59,46,0.68)", transform: "translateY(-1px)" },
            }),
          ...(ownerState.variant === "outlined" && {
            borderColor: brand.line,
            color: "#fff",
            "&:hover": { borderColor: brand.teal, background: "rgba(239,125,0,0.12)" },
          }),
        }),
        sizeLarge: { paddingBlock: 13, paddingInline: 26, fontSize: "1rem" },
      },
    },
    // Kill MUI's dark-mode elevation overlay so dark surfaces stay our exact colour.
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" }, rounded: { borderRadius: 20 } } },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          border: `1px solid ${brand.line}`,
          backgroundImage: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 18px 40px -22px rgba(0,0,0,0.6)",
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 999 } } },
    // Dark inputs: subtle fill, hairline border, orange focus ring.
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.04)",
          transition: "box-shadow .2s ease, border-color .2s ease",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.line },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.28)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: brand.teal, borderWidth: 2 },
          "&.Mui-focused": { boxShadow: `0 0 0 4px rgba(239,125,0,0.20)` },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { "&.Mui-focused": { color: brand.teal } } } },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(12,12,14,0.72)",
          backdropFilter: "saturate(180%) blur(16px)",
          WebkitBackdropFilter: "saturate(180%) blur(16px)",
          color: "#fff",
          boxShadow: "0 1px 0 rgba(255,255,255,0.06)",
        },
      },
    },
  },
});
