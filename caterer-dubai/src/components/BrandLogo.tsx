import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";

// The actual Caterer.com brand mark (sourced from caterer.com's own logo asset):
// the four-colour block — purple / yellow / orange / charcoal — with the catering
// figures, next to the "Caterer" wordmark. A small "DUBAI" tag marks this localised
// build. The wordmark ships white for dark headers; an on-light variant carries a
// charcoal wordmark so it stays legible on pale nav bars.
export default function BrandLogo({ dark = false }: { dark?: boolean }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box
        component="img"
        src={dark ? "/caterer-logo.svg" : "/caterer-logo-onlight.svg"}
        alt="Caterer"
        sx={{ height: 22, width: "auto", display: "block" }}
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
