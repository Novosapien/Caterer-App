import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";

// The real catererglobal.com brand mark (sourced from their own logo asset): the purple
// globe monogram next to the "caterer" + "global" + ".com" wordmark, where "global" carries
// the brand purple (#662181). A small "DUBAI" tag marks this localised build.
//
// The published asset is dark-ink-on-transparent with a grey strapline, which is unreadable
// on this near-black UI. So the shipped variants are recoloured from it: the wordmark ink is
// white for dark headers (`catererglobal-logo.png`) and original charcoal for pale surfaces
// (`-onlight`), with the strapline dropped so the wordmark reads at header size. The full
// lockup including "WHERE HOSPITALITY FINDS GREAT PEOPLE" is kept as `-full` for large use.
export default function BrandLogo({ dark = false }: { dark?: boolean }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box
        component="img"
        src={dark ? "/catererglobal-logo.png" : "/catererglobal-logo-onlight.png"}
        alt="catererglobal.com"
        // Taller than the old mark (22) because the globe's descender extends the asset's
        // box below the wordmark, so an equal height would render the wordmark smaller.
        // Held back on xs: this wordmark is wider than the old one, and at full size it
        // pushes the DUBAI tag into the header's "Post a job" button on a phone.
        sx={{ height: { xs: 21, sm: 27 }, width: "auto", display: "block" }}
      />
      <Typography
        component="span"
        sx={{
          fontFamily: display.style.fontFamily,
          fontWeight: 700,
          fontSize: "0.66rem",
          letterSpacing: "0.22em",
          color: brand.teal,
          mt: "1px",
        }}
      >
        DUBAI
      </Typography>
    </Box>
  );
}
