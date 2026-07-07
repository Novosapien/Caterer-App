import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import GigCard from "@/components/GigCard";
import EmptyState from "@/components/EmptyState";
import GigSearch from "@/components/candidate/GigSearch";
import GigDateChips from "@/components/candidate/GigDateChips";
import WhatsAppConnectBanner from "@/components/candidate/WhatsAppConnectBanner";
import { listOpenGigs } from "@/lib/queries";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";
import type { Job, JobSuggestion } from "@/lib/types";

// Dubai-local date key (YYYY-MM-DD) so date filters honour the venue's timezone.
function dubaiDateKey(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}

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

function filterByWhen(gigs: Job[], when: string): Job[] {
  if (!when) return gigs;
  const now = Date.now();
  const DAY = 86_400_000;
  const todayKey = dubaiDateKey(now);
  const tomorrowKey = dubaiDateKey(now + DAY);
  const weekEndKey = dubaiDateKey(now + 6 * DAY);
  return gigs.filter((g) => {
    const k = dubaiDateKey(new Date(g.start_at).getTime());
    if (when === "today") return k === todayKey;
    if (when === "tomorrow") return k === tomorrowKey;
    if (when === "week") return k >= todayKey && k <= weekEndKey;
    return true;
  });
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
  const allOpen = await listOpenGigs({}); // urgent already ordered first
  let gigs = urgentOnly ? allOpen.filter((j) => j.is_urgent) : allOpen;
  if (search) gigs = gigs.filter((j) => matchesQuery(j, search));
  gigs = filterByWhen(gigs, whenFilter);

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
        // Shiny piano-black, matching the landing page: one specular highlight fading
        // into a deep near-black. Calm and glossy, not a busy photo hero.
        backgroundColor: "#08080A",
        backgroundImage: `
          radial-gradient(120% 62% at 50% -10%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 52%),
          linear-gradient(180deg, #141416 0%, #0A0A0C 62%, #0C0C0E 100%)
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
        <Box sx={{ mt: 1.5 }}>
          <GigDateChips />
        </Box>

        {/* One quiet result count, no sort chrome. */}
        <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", mt: 3, mb: 1.5 }}>
          <Box component="span" sx={{ color: "#fff", fontWeight: 700 }}>
            {gigs.length}
          </Box>{" "}
          {gigs.length === 1 ? "gig" : "gigs"}
          {search ? ` for “${search}”` : " available"}
        </Typography>

        <Stack spacing={2}>
          {gigs.length === 0 ? (
            <EmptyState
              icon={<SearchOffIcon fontSize="inherit" />}
              title="No gigs match"
              subtitle={
                search || whenFilter || urgentOnly
                  ? "Try widening your filters: a different role, date or area."
                  : "No open gigs right now. Check back soon."
              }
            />
          ) : (
            gigs.map((job) => <GigCard key={job.id} job={job} />)
          )}
        </Stack>

        {/* A single quiet prompt at the end, not two competing banners. */}
        <WhatsAppConnectBanner sx={{ mt: 3, mb: 2 }} />
      </Container>
    </Box>
  );
}
