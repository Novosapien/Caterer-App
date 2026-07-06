import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import PaymentsIcon from "@mui/icons-material/Payments";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UrgentBadge from "@/components/UrgentBadge";
import ApplyPanel from "@/components/candidate/ApplyPanel";
import CvRatingCard from "@/components/candidate/CvRatingCard";
import { getGig, getCandidate } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { formatPay, formatStart } from "@/lib/format";
import { brand } from "@/theme/brand";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70";

// Full gig detail (R1) — no login required to view. params is a Promise (Next 16).
export default async function GigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getGig(id);
  if (!job) notFound();

  // If a chef is signed in, offer one-tap auto-apply with their saved profile + CV.
  const session = await getSession();
  const candidate =
    session?.role === "candidate" ? await getCandidate(session.profileId) : null;
  const applyCandidate = candidate
    ? { name: candidate.profile?.name ?? "you", hasCv: !!candidate.cv_url }
    : null;

  const venueImg = job.image_url || FALLBACK_IMG;

  // Pay is the hero fact (shown large); the rest render as icon-chip rows.
  const facts = [
    { icon: <ScheduleIcon />, label: formatStart(job.start_at) },
    { icon: <PlaceIcon />, label: `${job.venue} · ${job.location_area}` },
    ...(job.dress_code ? [{ icon: <CheckroomIcon />, label: job.dress_code }] : []),
  ];

  return (
    <Box>
      {/* Venue photo */}
      <Box
        sx={{
          position: "relative",
          height: { xs: 236, sm: 264 },
          backgroundImage: `linear-gradient(180deg, rgba(35,35,37,0.05) 0%, rgba(35,35,37,0.55) 100%), url(${venueImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Button
          component="a"
          href="/jobs"
          startIcon={<ArrowBackIcon />}
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            bgcolor: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: brand.navy,
            boxShadow: "0 2px 10px -4px rgba(35,35,37,0.35)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.78)" },
          }}
        >
          Gigs
        </Button>
      </Box>

      <Container maxWidth="sm" sx={{ pt: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 1 }}>
          {job.is_urgent && <UrgentBadge />}
          {job.is_temp && (
            <Chip label="Temp" size="small" sx={{ bgcolor: brand.cream, fontWeight: 700 }} />
          )}
          <Chip label={job.role_type} size="small" variant="outlined" />
        </Stack>

        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          {job.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
          {job.venue}
        </Typography>

        {/* Hero pay */}
        <Stack direction="row" spacing={1} sx={{ mt: 2.5, alignItems: "center" }}>
          <PaymentsIcon sx={{ color: brand.pay }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", lineHeight: 1, color: brand.pay }}>
            {formatPay(job.pay_aed, job.pay_unit)}
          </Typography>
        </Stack>

        <Stack spacing={1.25} sx={{ mt: 2 }}>
          {facts.map((row, i) => (
            <Stack key={i} direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  flexShrink: 0,
                  color: "teal.main",
                  bgcolor: `${brand.teal}18`,
                  "& svg": { fontSize: "1.15rem" },
                }}
              >
                {row.icon}
              </Box>
              <Typography sx={{ fontWeight: 600 }}>{row.label}</Typography>
            </Stack>
          ))}
        </Stack>

        {job.description && (
          <>
            <Divider sx={{ my: 2.5 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              About the shift
            </Typography>
            <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
              {job.description}
            </Typography>
          </>
        )}

        <Divider sx={{ my: 2.5 }} />

        {/* AI "Rate my CV" — offered to signed-in chefs before they apply. */}
        {candidate && (
          <Box sx={{ mb: 2.5 }}>
            <CvRatingCard jobId={job.id} />
          </Box>
        )}

        {/* Inline apply panel — sits BELOW the summary (R2, C5). */}
        <ApplyPanel jobId={job.id} candidate={applyCandidate} />
      </Container>
    </Box>
  );
}
