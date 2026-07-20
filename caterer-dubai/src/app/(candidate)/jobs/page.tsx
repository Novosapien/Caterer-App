import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import GigBrowser from "@/components/candidate/GigBrowser";
import WhatsAppConnectBanner from "@/components/candidate/WhatsAppConnectBanner";
import { listOpenGigs } from "@/lib/queries";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";
import type { JobSuggestion } from "@/lib/types";

// Candidate job feed (R1) — anonymous, no login. searchParams is a Promise (Next 16).
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; when?: string; urgent?: string }>;
}) {
  const { q, when, urgent } = await searchParams;

  // Fetch the FULL open catalogue once and hand it to the client browser, which owns
  // all filtering (search, date, and the multi-category Filters panel) in-memory so
  // every keystroke and tick is instant. URL params seed the initial state (deep links).
  const allOpen = await listOpenGigs({}); // urgent already ordered first

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
        // Flat near-black — the site background hex.
        backgroundColor: "#08080A",
      }}
    >
      <Container maxWidth="sm" sx={{ pt: { xs: 3.5, sm: 4.5 } }}>
        {/* Calm header: one orange accent, generous air (mirrors the landing). */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
          <Box
            sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: brand.teal, boxShadow: `0 0 12px ${brand.teal}` }}
          />
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.9rem" }}>
            {allOpen.length} live {allOpen.length === 1 ? "job" : "jobs"} across Dubai
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
            job
          </Box>
        </Typography>

        {/* Search + date chips + Filters panel + feed — one client component that filters
            the full catalogue in-memory, so search, dates and every filter are instant. */}
        <GigBrowser
          allGigs={allOpen}
          suggestions={suggestions}
          initialQuery={q?.trim() ?? ""}
          initialWhen={when?.trim() ?? ""}
          initialUrgent={urgent === "1"}
        />

        {/* A single quiet prompt at the end, not two competing banners. */}
        <WhatsAppConnectBanner sx={{ mt: 3, mb: 2 }} />
      </Container>
    </Box>
  );
}
