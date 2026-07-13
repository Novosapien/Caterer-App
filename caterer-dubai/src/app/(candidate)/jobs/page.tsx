import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import GigSearch from "@/components/candidate/GigSearch";
import JobsFeed from "@/components/candidate/JobsFeed";
import WhatsAppConnectBanner from "@/components/candidate/WhatsAppConnectBanner";
import { listOpenGigs } from "@/lib/queries";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";
import type { Job, JobSuggestion } from "@/lib/types";

// Substring match across the fields a chef would search by.
function matchesQuery(j: Job, search: string): boolean {
  const q = search.toLowerCase();
  return (
    j.title.toLowerCase().includes(q) ||
    j.venue.toLowerCase().includes(q) ||
    j.location_area.toLowerCase().includes(q) ||
    j.role_type.toLowerCase().includes(q)
  );
}

// Candidate gig feed (R1) — anonymous, no login. searchParams is a Promise (Next 16).
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; when?: string; urgent?: string }>;
}) {
  const { q, when, urgent } = await searchParams;
  const search = q?.trim() ?? "";
  const whenFilter = when?.trim() ?? "";
  const urgentOnly = urgent === "1";

  // Fetch the FULL open catalogue once: the feed is filtered from it, and the whole set
  // feeds the search box's instant type-ahead suggestions (independent of the filters).
  // Search + urgent are applied server-side (URL-driven); the Today/Tomorrow/This Week
  // date filter runs client-side in JobsFeed so switching it is instant (no round-trip).
  const allOpen = await listOpenGigs({}); // urgent already ordered first
  let baseGigs = urgentOnly ? allOpen.filter((j) => j.is_urgent) : allOpen;
  if (search) baseGigs = baseGigs.filter((j) => matchesQuery(j, search));

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
        color: "#fff",
        // Warm charcoal with one soft specular highlight fading into the charcoal.
        // Calm and glossy, not a busy photo hero.
        backgroundColor: "#252324",
        backgroundImage: `
          radial-gradient(120% 62% at 50% -10%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.025) 26%, rgba(255,255,255,0) 52%),
          linear-gradient(180deg, #2C2A2D 0%, #201E20 62%, #252324 100%)
        `,
      }}
    >
      <Container maxWidth="sm" sx={{ pt: { xs: 3.5, sm: 4.5 } }}>
        {/* Calm header: one orange accent, generous air (mirrors the landing). */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
          <Box
            sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: brand.teal, boxShadow: `0 0 12px ${brand.teal}` }}
          />
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.9rem" }}>
            {allOpen.length} live {allOpen.length === 1 ? "gig" : "gigs"} across Dubai
          </Typography>
        </Stack>

        <Typography
          component="h1"
          sx={{
            fontFamily: display.style.fontFamily,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
            fontSize: { xs: "2.2rem", sm: "2.6rem" },
            mb: { xs: 2.75, sm: 3.25 },
          }}
        >
          Find your next{" "}
          <Box component="span" sx={{ color: brand.teal }}>
            gig
          </Box>
        </Typography>

        {/* Search sits directly on the charcoal — a single clean field, no floating card. */}
        <GigSearch suggestions={suggestions} />

        {/* Date chips + count + list live in a client component so switching
            Today / Tomorrow / This Week filters in-memory (instant, no round-trip). */}
        <JobsFeed
          baseGigs={baseGigs}
          initialWhen={whenFilter}
          search={search}
          urgentOnly={urgentOnly}
        />

        {/* A single quiet prompt at the end, not two competing banners. */}
        <WhatsAppConnectBanner sx={{ mt: 3, mb: 2 }} />
      </Container>
    </Box>
  );
}
