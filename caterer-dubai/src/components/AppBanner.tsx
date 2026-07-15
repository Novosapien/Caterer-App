import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";

// "Get the app" footer banner. A single phone rises from the bottom of the section and is
// cut off halfway, showing the app's welcome screen (brand mark + a "find your role"
// tagline), so the phone is the promo. Presentational only.
export default function AppBanner() {
  return (
    <Box sx={{ position: "relative", textAlign: "center", pt: { xs: 1, sm: 2 } }}>
      <Typography
        sx={{
          fontFamily: display.style.fontFamily,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          fontSize: { xs: "1.6rem", sm: "2.1rem" },
          color: "#fff",
        }}
      >
        Get the Caterer.com{" "}
        <Box component="span" sx={{ color: brand.teal }}>
          Dubai
        </Box>{" "}
        app
      </Typography>
      <Typography
        sx={{
          mt: 1,
          mx: "auto",
          maxWidth: 360,
          color: "rgba(255,255,255,0.6)",
          fontSize: { xs: "0.9rem", sm: "1rem" },
          lineHeight: 1.5,
        }}
      >
        Browse gigs, apply in taps and get hired across Dubai.
      </Typography>

      {/* Phone stage: the phone hangs from the top and the stage's overflow:hidden cuts it
          off lower down, so it reads as a phone emerging from the bottom of the screen. */}
      <Box
        sx={{
          position: "relative",
          mt: { xs: 3, sm: 3.5 },
          height: { xs: 300, sm: 336 },
          overflow: "hidden",
        }}
      >
        {/* Warm glow behind the phone, so it feels lit from below rather than pasted on. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: { xs: 360, sm: 440 },
            height: { xs: 300, sm: 360 },
            transform: "translateX(-50%)",
            background: `radial-gradient(50% 50% at 50% 60%, ${brand.teal}30 0%, ${brand.teal}00 70%)`,
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 10,
            transform: "translateX(-50%)",
            width: { xs: 250, sm: 284 },
          }}
        >
          <PhoneApp />
        </Box>
      </Box>
    </Box>
  );
}

// The app's welcome screen: brand mark, a warm "find your role" tagline, and a CTA. Dark
// screen, on-brand, so it reads as the real app rather than a generic mock.
function PhoneApp() {
  return (
    <Box
      sx={{
        borderRadius: "40px",
        bgcolor: "#050506",
        p: "12px",
        boxShadow:
          "0 40px 80px -30px rgba(0,0,0,0.9), inset 0 0 0 1.5px rgba(255,255,255,0.16), 0 0 0 1px rgba(0,0,0,0.9)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: "30px",
          overflow: "hidden",
          bgcolor: "#0D0D10",
          color: "#fff",
          px: 3,
          pt: 2,
          pb: 5,
          textAlign: "center",
        }}
      >
        {/* Dynamic Island camera tab */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 58,
            height: 18,
            borderRadius: 999,
            bgcolor: "#000",
            zIndex: 3,
          }}
        />

        {/* Brand mark */}
        <Stack direction="row" spacing={0.75} sx={{ mt: 3.25, justifyContent: "center", alignItems: "center" }}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: "5px",
              bgcolor: brand.teal,
              display: "grid",
              placeItems: "center",
              fontSize: "0.7rem",
              fontWeight: 900,
              color: "#0D0D10",
            }}
          >
            C
          </Box>
          <Box sx={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.01em" }}>
            Caterer<Box component="span" sx={{ color: brand.teal }}>.com</Box>
          </Box>
        </Stack>

        <Typography
          sx={{
            mt: 3,
            fontFamily: display.style.fontFamily,
            fontWeight: 800,
            fontSize: "1.5rem",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          Find the right{" "}
          <Box component="span" sx={{ color: brand.teal }}>
            role
          </Box>{" "}
          for you
        </Typography>

        <Typography sx={{ mt: 1.25, fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
          Chef, waiter or crew. Your next gig across Dubai, in your pocket.
        </Typography>

        {/* App-style CTA */}
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            mt: 3,
            mx: "auto",
            width: "fit-content",
            alignItems: "center",
            px: 2.25,
            py: 1,
            borderRadius: "999px",
            bgcolor: brand.teal,
            color: "#0D0D10",
            fontWeight: 800,
            fontSize: "0.8rem",
          }}
        >
          Browse gigs
          <ArrowForwardIcon sx={{ fontSize: "0.95rem" }} />
        </Stack>
      </Box>
    </Box>
  );
}
