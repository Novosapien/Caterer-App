import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import GroupsIcon from "@mui/icons-material/Groups";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import BrandLogo from "@/components/BrandLogo";
import LandingMenu from "@/components/LandingMenu";
import LandingSearch from "@/components/LandingSearch";
import RoleCarousel, { type RoleCard } from "@/components/RoleCarousel";
import { loginAsRecruiterAndPost } from "@/app/actions/auth";
import { listOpenGigs } from "@/lib/queries";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";
import type { JobSuggestion } from "@/lib/types";

const UNSPLASH = "https://images.unsplash.com/photo-";
const img = (id: string) => `${UNSPLASH}${id}?auto=format&fit=crop&w=1000&q=80`;

// Hero chef: a professional in chef whites slicing fish for sushi (Tokyo). Bleeds in
// from the top-right and dissolves into the shiny black so the headline stays legible.
const HERO_CHEF = `${UNSPLASH}1609558531790-ec0fe1237631?auto=format&fit=crop&w=1400&q=80`;

// The swipeable role rail. Each niche advertises itself and deep-links into the
// feed pre-filtered by its keyword. `keywords` also power the live open-role count
// shown on the card, so the numbers are real, not decorative.
const ROLE_DEFS = [
  { label: "CHEF", headline: "Apply for chef roles today", href: "/jobs?q=chef", image: img("1577219491135-ce391730fb2c"), keywords: ["chef", "cook", "sous", "commis"] },
  { label: "WAITER", headline: "Apply for waiter roles today", href: "/jobs?q=waiter", image: img("1592861956120-e524fc739696"), keywords: ["waiter", "waitress", "server", "runner", "service"] },
  { label: "BARTENDER", headline: "Apply for bar roles today", href: "/jobs?q=bartender", image: img("1514362545857-3bc16c4c7d1b"), keywords: ["bartender", "barista", "mixolog", "bar"] },
  { label: "KITCHEN PORTER", headline: "Apply to be a kitchen porter", href: "/jobs?q=porter", image: img("1581299894007-aaa50297cf16"), keywords: ["porter", "steward", "dishwash"] },
  { label: "HOST", headline: "Apply for host roles today", href: "/jobs?q=host", image: img("1552566626-52f8b828add9"), keywords: ["host", "hostess", "front of house", "reception", "maitre"] },
];

// Landing: restrained and confident. Deep charcoal, one orange accent, generous air.
// No vanity metrics, no icon grid, no superlatives — the calm reads as expensive.
export default async function Landing() {
  const allOpen = await listOpenGigs({});
  const count = allOpen.length;

  // Count real open roles per niche so each card carries an honest number.
  const roles: RoleCard[] = ROLE_DEFS.map((r) => {
    const n = allOpen.filter((j) => {
      const hay = `${j.title} ${j.role_type}`.toLowerCase();
      return r.keywords.some((k) => hay.includes(k));
    }).length;
    return {
      label: r.label,
      headline: r.headline,
      href: r.href,
      image: r.image,
      sub: n > 0 ? `${n} open ${n === 1 ? "role" : "roles"} across Dubai` : "Roles across Dubai",
    };
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
            <Button
              component="a"
              href="/jobs"
              sx={{ display: { xs: "none", sm: "inline-flex" }, color: "rgba(255,255,255,0.82)", fontWeight: 600, px: 1, "&:hover": { color: "#fff", bgcolor: "transparent" } }}
            >
              Find a job
            </Button>
            <form action={loginAsRecruiterAndPost}>
              <Button
                type="submit"
                variant="contained"
                color="teal"
                sx={{ fontWeight: 700, px: { xs: 1.75, sm: 2.5 }, whiteSpace: "nowrap" }}
              >
                Post a job
              </Button>
            </form>
            <LandingMenu />
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
            Chefs, waiters and crew. From urgent temp shifts to permanent
            roles, hire and get hired in one place.
          </Typography>
        </Box>

        {/* Search — a single clean field on the charcoal. */}
        <Box sx={{ width: "100%" }}>
          <LandingSearch suggestions={suggestions} />
        </Box>

        {/* Live-gigs pill with a direct route into the full feed. */}
        <Box
          component="a"
          href="/jobs"
          sx={{
            mt: 2.5,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 2,
            py: 1.5,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            transition: "border-color 0.2s ease, background-color 0.2s ease",
            "&:hover": { borderColor: "rgba(239,125,0,0.5)", bgcolor: "rgba(255,255,255,0.02)" },
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <GroupsIcon sx={{ color: brand.tealBright, fontSize: "1.35rem" }} />
            <Typography sx={{ color: "rgba(255,255,255,0.82)", fontWeight: 500, fontSize: "0.95rem" }}>
              <Box component="span" sx={{ color: brand.tealBright, fontWeight: 800 }}>
                {count.toLocaleString("en-GB")}
              </Box>{" "}
              live {count === 1 ? "gig" : "gigs"} right now
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", flexShrink: 0 }}>
            <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem" }}>View all jobs</Typography>
            <KeyboardArrowRightIcon sx={{ color: brand.tealBright, fontSize: "1.2rem" }} />
          </Stack>
        </Box>

        {/* Section header for the role rail */}
        <Stack
          direction="row"
          sx={{ mt: { xs: 4, sm: 5 }, mb: 2, alignItems: "baseline", justifyContent: "space-between" }}
        >
          <Typography
            sx={{ fontFamily: display.style.fontFamily, fontWeight: 700, fontSize: { xs: "1.35rem", sm: "1.5rem" } }}
          >
            Popular roles today
          </Typography>
          <Box component="a" href="/jobs" sx={{ textDecoration: "none" }}>
            <Typography sx={{ color: brand.tealBright, fontWeight: 700, fontSize: "0.9rem" }}>
              View all roles
            </Typography>
          </Box>
        </Stack>

        {/* Swipeable role rail: browse by niche, each card deep-links into the feed. */}
        <RoleCarousel roles={roles} />

        <Box sx={{ flex: 1, minHeight: 40 }} />
      </Container>
    </Box>
  );
}
