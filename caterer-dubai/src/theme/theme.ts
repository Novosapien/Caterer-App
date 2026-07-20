"use client";

import { createTheme } from "@mui/material/styles";
import { brand, md } from "./brand";
import { display, body } from "./fonts";

// Re-exported for existing `import { brand } from "@/theme/theme"` call sites.
export { brand };

// Material Design 3 theme (dark scheme), branded with Caterer purple as `primary`.
// The MD3 token layer lives in brand.ts (`md`). We keep `teal` and `flame` as first-class
// palette colours so existing <Button color="teal" | "flame"> call sites stay valid.
declare module "@mui/material/styles" {
  interface Palette {
    teal: Palette["primary"];
    flame: Palette["primary"];
    tonal: Palette["primary"];
  }
  interface PaletteOptions {
    teal?: PaletteOptions["primary"];
    flame?: PaletteOptions["primary"];
    tonal?: PaletteOptions["primary"];
  }
}
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    teal: true;
    flame: true;
    tonal: true;
  }
  interface ButtonPropsVariantOverrides {
    tonal: true;
    elevated: true;
  }
}
declare module "@mui/material/SvgIcon" {
  interface SvgIconPropsColorOverrides {
    teal: true;
    flame: true;
    tonal: true;
  }
}
declare module "@mui/material/Fab" {
  interface FabPropsColorOverrides {
    tonal: true;
  }
}

const displayFont = display.style.fontFamily;
const bodyFont = body.style.fontFamily;

// MUI needs a 25-length shadow ladder; MD3 defines 6 elevation levels (0-5).
const shadows = [
  md.elevation[0],
  md.elevation[1],
  md.elevation[2],
  md.elevation[3],
  md.elevation[4],
  md.elevation[5],
  ...Array(19).fill(md.elevation[5]),
] as unknown as ReturnType<typeof createTheme>["shadows"];

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "dark",
    primary: {
      main: md.primary,
      dark: brand.tealDeep,
      light: brand.tealBright,
      contrastText: md.onPrimary,
    },
    secondary: { main: md.secondary, contrastText: md.onSecondary },
    warning: { main: md.tertiary, contrastText: md.onTertiary },
    error: { main: brand.flame, dark: brand.flameDeep, contrastText: "#FFFFFF" },
    success: { main: brand.pay, contrastText: "#06210F" },
    // Aliases kept for existing color="teal" | "flame" usages.
    teal: { main: md.primary, dark: brand.tealDeep, contrastText: md.onPrimary },
    flame: { main: brand.flame, dark: brand.flameDeep, contrastText: "#FFFFFF" },
    // Filled-tonal helper colour (secondary container).
    tonal: { main: md.secondaryContainer, contrastText: md.onSecondaryContainer },
    background: { default: md.surface, paper: md.surfaceContainerLow },
    text: { primary: md.onSurface, secondary: md.onSurfaceVariant },
    divider: md.outlineVariant,
  },
  // --- MD3 type scale (display / headline / title / body / label) --------------
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: displayFont, fontWeight: 700, fontSize: "3.5rem", lineHeight: 1.12, letterSpacing: "-0.02em" },
    h2: { fontFamily: displayFont, fontWeight: 700, fontSize: "2.8rem", lineHeight: 1.16, letterSpacing: "-0.015em" },
    h3: { fontFamily: displayFont, fontWeight: 700, fontSize: "2.25rem", lineHeight: 1.22, letterSpacing: "-0.01em" },
    h4: { fontFamily: displayFont, fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.29, letterSpacing: "0em" },
    h5: { fontFamily: displayFont, fontWeight: 600, fontSize: "1.5rem", lineHeight: 1.33, letterSpacing: "0em" },
    h6: { fontFamily: displayFont, fontWeight: 600, fontSize: "1.375rem", lineHeight: 1.27, letterSpacing: "0em" },
    subtitle1: { fontFamily: bodyFont, fontWeight: 500, fontSize: "1rem", lineHeight: 1.5, letterSpacing: "0.009em" },
    subtitle2: { fontFamily: bodyFont, fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.43, letterSpacing: "0.006em" },
    body1: { fontSize: "1rem", lineHeight: 1.5, letterSpacing: "0.031em" },
    body2: { fontSize: "0.875rem", lineHeight: 1.43, letterSpacing: "0.017em" },
    button: { fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.43, letterSpacing: "0.006em", textTransform: "none" },
    caption: { fontSize: "0.75rem", lineHeight: 1.33, letterSpacing: "0.03em" },
    overline: { fontWeight: 600, fontSize: "0.6875rem", lineHeight: 1.45, letterSpacing: "0.09em", textTransform: "uppercase" },
  },
  // MD3 medium shape as the base corner.
  shape: { borderRadius: md.shape.md },
  shadows,
  components: {
    // --- MD3 buttons: filled / tonal / outlined / elevated / text --------------
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ ownerState, theme: t }) => ({
          borderRadius: md.shape.full, // MD3 buttons are fully rounded (stadium)
          paddingInline: 24,
          paddingBlock: 10,
          minHeight: 40,
          fontWeight: 600,
          textTransform: "none",
          transition:
            "background-color .2s ease, box-shadow .2s ease, border-color .2s ease, transform .15s ease",
          "&:active": { transform: "scale(0.98)" },
          // Filled (primary / teal): solid brand, MD3 state layers, no gradient.
          ...((ownerState.variant === "contained" || ownerState.variant === undefined) &&
            (ownerState.color === "primary" || ownerState.color === "teal") && {
              backgroundColor: md.primary,
              color: md.onPrimary,
              "&:hover": {
                backgroundColor: md.primary,
                boxShadow: md.elevation[1],
                backgroundImage: `linear-gradient(0deg, rgba(36,17,0,${md.state.hover}), rgba(36,17,0,${md.state.hover}))`,
              },
              "&:active": {
                backgroundImage: `linear-gradient(0deg, rgba(36,17,0,${md.state.pressed}), rgba(36,17,0,${md.state.pressed}))`,
              },
            }),
          ...(ownerState.variant === "contained" &&
            ownerState.color === "secondary" && {
              backgroundColor: md.secondaryContainer,
              color: md.onSecondaryContainer,
              "&:hover": { boxShadow: md.elevation[1] },
            }),
          ...(ownerState.variant === "contained" &&
            ownerState.color === "flame" && {
              backgroundColor: brand.flame,
              color: "#fff",
              "&:hover": { boxShadow: md.elevation[1] },
            }),
          // Filled tonal.
          ...(ownerState.variant === "tonal" && {
            backgroundColor: md.secondaryContainer,
            color: md.onSecondaryContainer,
            "&:hover": {
              boxShadow: md.elevation[1],
              backgroundImage: `linear-gradient(0deg, rgba(247,217,246,${md.state.hover}), rgba(247,217,246,${md.state.hover}))`,
            },
          }),
          // Elevated.
          ...(ownerState.variant === "elevated" && {
            backgroundColor: md.surfaceContainerLow,
            color: md.primary,
            boxShadow: md.elevation[1],
            "&:hover": { boxShadow: md.elevation[2] },
          }),
          // Outlined: MD3 outline border, primary label, state layer on hover.
          ...(ownerState.variant === "outlined" && {
            borderColor: md.outline,
            color: t.palette.text.primary,
            "&:hover": {
              borderColor: md.outline,
              backgroundColor: `rgba(146,65,153,${md.state.hover})`,
            },
          }),
          // Text: primary label, state layer.
          ...(ownerState.variant === "text" && {
            "&:hover": { backgroundColor: `rgba(146,65,153,${md.state.hover})` },
          }),
        }),
        sizeSmall: { minHeight: 32, paddingInline: 16, paddingBlock: 6 },
        sizeLarge: { minHeight: 48, paddingInline: 28, paddingBlock: 12, fontSize: "1rem" },
      },
    },
    // Surfaces keep our exact colour (no MUI dark elevation overlay).
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        rounded: { borderRadius: md.shape.lg },
      },
    },
    // MD3 elevated card.
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: {
          borderRadius: md.shape.md,
          backgroundColor: md.surfaceContainerLow,
          backgroundImage: "none",
          boxShadow: md.elevation[1],
        },
      },
    },
    // MD3 assist/filter chip.
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: md.shape.sm },
        outlined: { borderColor: md.outlineVariant },
      },
    },
    // MD3 text field (outlined): 4px corner, 2px primary focus ring.
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: md.shape.xs,
          backgroundColor: "rgba(255,255,255,0.04)",
          transition: "box-shadow .2s ease, border-color .2s ease",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: md.outline },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: md.onSurfaceVariant },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: md.primary, borderWidth: 2 },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { "&.Mui-focused": { color: md.primary } } } },
    // Dropdowns open flush beneath their field (no floating gap, no selected-item
    // overlay). Applies to every <Select> and <TextField select> across the app.
    // The height is capped so a long list (e.g. 11 role types) always fits directly
    // below the field on a phone and scrolls internally, instead of MUI repositioning
    // the whole menu to fit the viewport (which detached it from the field).
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          anchorOrigin: { vertical: "bottom", horizontal: "left" },
          transformOrigin: { vertical: "top", horizontal: "left" },
          marginThreshold: 0,
          slotProps: {
            paper: { sx: { mt: 0.5, borderRadius: 2, maxHeight: "38vh" } },
          },
        },
      },
    },
    // MD3 top app bar: flat surface container, hairline separation.
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: md.surfaceContainer,
          backgroundImage: "none",
          color: md.onSurface,
          boxShadow: "none",
          borderBottom: `1px solid ${md.outlineVariant}`,
        },
      },
    },
    // MD3 FAB: primary-container tonal, large corner, level-3 elevation.
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: md.shape.lg,
          textTransform: "none",
          fontWeight: 600,
          backgroundColor: md.primaryContainer,
          color: md.onPrimaryContainer,
          boxShadow: md.elevation[3],
          "&:hover": { backgroundColor: md.primaryContainer, boxShadow: md.elevation[4] },
        },
      },
    },
    // MD3 navigation bar container + active-indicator pill.
    MuiBottomNavigation: {
      styleOverrides: {
        root: { backgroundColor: md.surfaceContainer, height: 72 },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: md.onSurfaceVariant,
          paddingTop: 12,
          paddingBottom: 12,
          "& .MuiBottomNavigationAction-label": { fontSize: "0.75rem", fontWeight: 600, marginTop: 4 },
          "& .MuiSvgIcon-root": {
            // content-box so the 20px pill padding sits AROUND the 24px glyph rather than
            // collapsing it to zero width under the global border-box reset.
            boxSizing: "content-box",
            borderRadius: md.shape.full,
            padding: "4px 20px",
            transition: "background-color .2s ease, color .2s ease",
          },
          "&.Mui-selected": { color: md.onSurface },
          "&.Mui-selected .MuiSvgIcon-root": {
            backgroundColor: md.secondaryContainer,
            color: md.onSecondaryContainer,
          },
        },
      },
    },
    // MD3 large containers.
    MuiDialog: { styleOverrides: { paper: { borderRadius: md.shape.xl, backgroundColor: md.surfaceContainerHigh } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: md.surfaceContainer, backgroundImage: "none" } } },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: md.surfaceContainerHighest, color: md.onSurface, borderRadius: md.shape.xs, fontSize: "0.75rem" },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        track: { borderRadius: 999, opacity: 1, backgroundColor: md.surfaceContainerHighest },
        thumb: { boxShadow: "none" },
      },
    },
  },
});
