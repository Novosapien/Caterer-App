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

      {/* Phone stage: shorter than the phone, with overflow:hidden, and no margin below the
          banner (see page.tsx). The stage's bottom sits at the page's bottom edge, so the
          phone is clipped there — it runs off the bottom of the screen. */}
      <Box
        sx={{
          position: "relative",
          mt: { xs: 3, sm: 3.5 },
          height: { xs: 384, sm: 420 },
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

// The app's welcome screen: brand mark, a warm "find your role" tagline, and a CTA. The
// whole phone is a link into the gig feed, so it's tappable wherever the bottom edge cuts
// it (the visible Browse gigs button is the cue). Dark screen, on-brand.
function PhoneApp() {
  return (
    <Box
      component="a"
      href="/jobs"
      aria-label="Browse gigs"
      sx={{
        display: "block",
        textDecoration: "none",
        color: "#fff",
        cursor: "pointer",
        borderRadius: "40px",
        bgcolor: "#050506",
        p: "12px",
        boxShadow:
          "0 40px 80px -30px rgba(0,0,0,0.9), inset 0 0 0 1.5px rgba(255,255,255,0.16), 0 0 0 1px rgba(0,0,0,0.9)",
        transition: "transform .15s",
        "&:active": { transform: "translateY(1px)" },
        // Lift + brighten the CTA whenever the phone (the link) is hovered.
        "&:hover .browse-cta": {
          transform: "translateY(-2px)",
          filter: "brightness(1.07)",
          boxShadow: `0 10px 24px -6px ${brand.teal}B0`,
        },
        "&:hover .browse-cta svg": { transform: "translateX(3px)" },
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
        <Stack direction="row" spacing={0.75} sx={{ mt: 2.5, justifyContent: "center", alignItems: "center" }}>
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
            mt: 2.25,
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
          Chef, waiter or crew. Gigs across Dubai.
        </Typography>

        {/* App-style CTA cue — the whole phone is the link, so this is a visual button. It
            lifts/brightens on hover (and when the phone is hovered) so it reads clickable. */}
        <Stack
          className="browse-cta"
          direction="row"
          spacing={0.75}
          sx={{
            mt: 2.5,
            mx: "auto",
            width: "fit-content",
            alignItems: "center",
            px: 2.5,
            py: 1.1,
            borderRadius: "999px",
            bgcolor: brand.teal,
            color: "#0D0D10",
            fontWeight: 800,
            fontSize: "0.82rem",
            transition: "transform .18s ease, filter .18s ease, box-shadow .18s ease",
            boxShadow: `0 6px 18px -8px ${brand.teal}99`,
            "& svg": { transition: "transform .18s ease" },
          }}
        >
          Browse gigs
          <ArrowForwardIcon sx={{ fontSize: "0.95rem" }} />
        </Stack>

        {/* Popular roles — app-like filler that runs off the bottom edge of the screen. */}
        <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 0.75 }}>
          {["Chef", "Waiter", "Barista", "Bartender", "Kitchen porter", "Events crew"].map((r) => (
            <Box
              key={r}
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: "0.62rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {r}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
