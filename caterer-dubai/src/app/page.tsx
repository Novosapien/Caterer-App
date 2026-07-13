import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import QRCode from "qrcode";
import BrandLogo from "@/components/BrandLogo";
import LandingMenu from "@/components/LandingMenu";
import LandingSearch from "@/components/LandingSearch";
import AppBanner from "@/components/AppBanner";
import { signOut } from "@/app/actions/auth";
import { getSession } from "@/lib/session";
import { listOpenGigs } from "@/lib/queries";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";
import type { JobSuggestion } from "@/lib/types";

const UNSPLASH = "https://images.unsplash.com/photo-";

// Hero chef: a professional in chef whites slicing fish for sushi (Tokyo). Bleeds in
// from the top-right and dissolves into the shiny black so the headline stays legible.
const HERO_CHEF = `${UNSPLASH}1609558531790-ec0fe1237631?auto=format&fit=crop&w=1400&q=80`;

// Landing: restrained and confident. Deep charcoal, one orange accent, generous air.
// No vanity metrics, no icon grid, no superlatives — the calm reads as expensive.
export default async function Landing() {
  const [allOpen, session] = await Promise.all([listOpenGigs({}), getSession()]);
  const role = session?.role ?? null;

  // Real QR pointing to caterer.com (same target as their site's app banner), rendered
  // as inline SVG so it's self-contained. Dark modules on the white tile in AppBanner.
  const qrSvg = await QRCode.toString("https://www.caterer.com/", {
    type: "svg",
    margin: 0,
    color: { dark: "#0A0A0C", light: "#0000" },
  });

  const suggestions: JobSuggestion[] = allOpen.map((j) => ({
    id: j.id,
    title: j.title,
    role_type: j.role_type,
    venue: j.venue,
    location_area: j.location_area,
    pay_aed: j.pay_aed,
    pay_unit: j.pay_unit,
    is_urgent: j.is_urgent,
  }));

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        // Shiny piano black: a bright specular highlight up top fading into a deep
        // near-black body with a dark vignette, giving a glossy, reflective finish.
        backgroundColor: "#08080A",
        backgroundImage: `
          radial-gradient(120% 72% at 50% -14%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 50%),
          radial-gradient(90% 60% at 50% 116%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 60%),
          linear-gradient(180deg, #17171A 0%, #070708 58%, #0C0C0E 100%)
        `,
      }}
    >
      {/* Hero chef photo, sitting right-of-centre and dissolving into the black. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: { xs: 560, sm: 660 },
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: `
            linear-gradient(90deg, #08080A 0%, rgba(8,8,10,0.86) 28%, rgba(8,8,10,0.45) 50%, rgba(8,8,10,0.12) 76%, rgba(8,8,10,0) 100%),
            linear-gradient(180deg, rgba(8,8,10,0.38) 0%, rgba(8,8,10,0) 18%, rgba(8,8,10,0) 58%, #08080A 100%),
            url(${HERO_CHEF})
          `,
          backgroundSize: "cover",
          backgroundPosition: "12% top",
        }}
      />

      {/* Soft-focus the left half so the headline reads cleanly; clears toward the chef. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: { xs: 560, sm: 660 },
          zIndex: 0,
          pointerEvents: "none",
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          maskImage: "linear-gradient(90deg, #000 0%, #000 34%, rgba(0,0,0,0.35) 58%, transparent 74%)",
          WebkitMaskImage: "linear-gradient(90deg, #000 0%, #000 34%, rgba(0,0,0,0.35) 58%, transparent 74%)",
        }}
      />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar — quiet. Logo, one text link, one subdued action. */}
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", pt: 3 }}
        >
          <Box component="a" href="/" sx={{ textDecoration: "none", display: "inline-flex" }}>
            <BrandLogo dark />
          </Box>
          <Stack direction="row" spacing={{ xs: 0.75, sm: 1.5 }} sx={{ alignItems: "center" }}>
            {role ? (
              <form action={signOut}>
                <Button
                  type="submit"
                  sx={{ display: { xs: "none", sm: "inline-flex" }, color: "rgba(255,255,255,0.82)", fontWeight: 600, px: 1, "&:hover": { color: "#fff", bgcolor: "transparent" } }}
                >
                  Log out
                </Button>
              </form>
            ) : (
              <Button
                component="a"
                href="/login"
                sx={{ display: { xs: "none", sm: "inline-flex" }, color: "rgba(255,255,255,0.82)", fontWeight: 600, px: 1, "&:hover": { color: "#fff", bgcolor: "transparent" } }}
              >
                Log in
              </Button>
            )}
            <Button
              component="a"
              href={role === "recruiter" ? "/post" : "/signup?type=business"}
              variant="contained"
              color="teal"
              sx={{ fontWeight: 700, px: { xs: 1.75, sm: 2.5 }, whiteSpace: "nowrap" }}
            >
              Post a job
            </Button>
            <LandingMenu role={role} />
          </Stack>
        </Stack>

        {/* Headline block — the words flow around a chef-shaped cutout on the right. */}
        <Box sx={{ pt: { xs: 5, sm: 10 }, pb: { xs: 4, sm: 6 } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: { xs: 3, sm: 4 } }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: brand.teal,
                boxShadow: `0 0 12px ${brand.teal}`,
              }}
            />
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.9rem", letterSpacing: "0.01em" }}>
              Now hiring across Dubai
            </Typography>
          </Stack>

          <Typography
            component="h1"
            sx={{
              fontFamily: display.style.fontFamily,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.03,
              fontSize: { xs: "2.6rem", sm: "3.5rem" },
            }}
          >
            {/* Chef-shaped cutout on the right: gentle at the top so ~two words fit per
                line ("The catering"), stepping further left lower down where his arm and
                hands come in, so the words hug his silhouette without cramming. */}
            <Box
              aria-hidden
              component="span"
              sx={{
                float: "right",
                width: { xs: "44%", sm: "46%" },
                height: { xs: 230, sm: 300 },
                shapeOutside: "polygon(58% 0%, 100% 0%, 100% 100%, 12% 100%)",
                WebkitShapeOutside: "polygon(58% 0%, 100% 0%, 100% 100%, 12% 100%)",
                shapeMargin: "12px",
              }}
            />
            The catering job platform for{" "}
            <Box component="span" sx={{ color: brand.teal }}>
              Dubai.
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: { xs: 3, sm: 3.5 },
              color: "rgba(255,255,255,0.62)",
              fontWeight: 400,
              fontSize: { xs: "1.05rem", sm: "1.15rem" },
              lineHeight: 1.55,
              maxWidth: 440,
            }}
          >
            Chefs, waiters and crew. Hire and get hired in one place.
          </Typography>
        </Box>

        {/* Search — a single clean field on the charcoal. */}
        <Box sx={{ width: "100%" }}>
          <LandingSearch suggestions={suggestions} />
        </Box>

        <Box sx={{ flex: 1, minHeight: 48 }} />

        {/* Get-the-app footer banner (QR to caterer.com + Dubai phone mock). */}
        <Box sx={{ mt: 4, mb: 5 }}>
          <AppBanner qrSvg={qrSvg} />
        </Box>
      </Container>
    </Box>
  );
}
