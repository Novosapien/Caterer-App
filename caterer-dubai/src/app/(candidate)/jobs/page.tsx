import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import GigCard from "@/components/GigCard";
import EmptyState from "@/components/EmptyState";
import GigSearch from "@/components/candidate/GigSearch";
import GigDateChips from "@/components/candidate/GigDateChips";
import CompleteProfileBanner from "@/components/candidate/CompleteProfileBanner";
import { listOpenGigs } from "@/lib/queries";
import { brand } from "@/theme/brand";
import type { Job, JobSuggestion } from "@/lib/types";

const HERO_IMG =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=75";

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
    <Box>
      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          minHeight: 232,
          backgroundImage: `linear-gradient(180deg, rgba(35,35,37,0.28) 0%, rgba(35,35,37,0.34) 45%, rgba(35,35,37,0.86) 100%), url(${HERO_IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          px: 2.5,
          pt: 3,
          pb: 2.5,
        }}
      >
        {/* LIVE NOW pill */}
        <Box
          sx={{
            position: "absolute",
            top: 18,
            left: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.4,
            py: 0.5,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.28)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: brand.tealBright,
              boxShadow: `0 0 10px ${brand.tealBright}`,
              animation: "livepulse 1.6s ease-in-out infinite",
              "@keyframes livepulse": {
                "0%,100%": { opacity: 1, transform: "scale(1)" },
                "50%": { opacity: 0.4, transform: "scale(0.7)" },
              },
            }}
          />
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.72rem", letterSpacing: "0.08em" }}>
            LIVE NOW
          </Typography>
        </Box>

        <Typography
          variant="h2"
          sx={{ color: "#fff", lineHeight: 1.0, fontSize: { xs: "2.5rem", sm: "3rem" } }}
        >
          Gigs in{" "}
          <Box component="span" sx={{ color: brand.tealBright }}>
            Dubai
          </Box>
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.9)", mt: 1, maxWidth: 320, fontWeight: 500 }}>
          Find catering &amp; hospitality gigs that fit your schedule.
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 2 }}>
        {/* Floating glass search card overlapping the hero — modern marketplace pattern */}
        <Paper
          elevation={0}
          sx={{
            mt: "-28px",
            p: 1.5,
            borderRadius: 5,
            border: `1px solid ${brand.line}`,
            boxShadow: "0 26px 60px -30px rgba(35,35,37,0.5)",
          }}
        >
          <GigSearch suggestions={suggestions} />
          <Box sx={{ mt: 1.25 }}>
            <GigDateChips />
          </Box>
        </Paper>

        {/* Count + sort row */}
        <Stack
          direction="row"
          sx={{ mt: 2, alignItems: "center", justifyContent: "space-between", gap: 1 }}
        >
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline" }}>
            <Typography sx={{ fontWeight: 800, color: brand.teal, fontSize: "1.15rem" }}>
              {gigs.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {gigs.length === 1 ? "gig" : "gigs"}
              {search ? ` for “${search}”` : " available"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Sort by:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: brand.teal }}>
              {urgentOnly ? "Urgent" : "Urgent first"}
            </Typography>
            <KeyboardArrowDownIcon sx={{ fontSize: "1.1rem", color: brand.teal }} />
          </Stack>
        </Stack>

        <Stack spacing={2} sx={{ mt: 1.5 }}>
          {gigs.length === 0 ? (
            <EmptyState
              icon={<SearchOffIcon fontSize="inherit" />}
              title="No gigs match"
              subtitle={
                search || whenFilter || urgentOnly
                  ? "Try widening your filters — different role, date or area."
                  : "No open gigs right now. Check back soon."
              }
            />
          ) : (
            gigs.map((job) => <GigCard key={job.id} job={job} />)
          )}
        </Stack>

        <CompleteProfileBanner sx={{ mt: 3 }} />
      </Container>
    </Box>
  );
}
