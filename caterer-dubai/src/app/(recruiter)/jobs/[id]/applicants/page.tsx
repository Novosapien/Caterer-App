import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getGig, listApplicationsForJob } from "@/lib/queries";
import UrgentBadge from "@/components/UrgentBadge";
import EmptyState from "@/components/EmptyState";
import { formatStart, formatPay, relativeTime } from "@/lib/format";
import { brand } from "@/theme/brand";

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, applications] = await Promise.all([getGig(id), listApplicationsForJob(id)]);

  if (!job) {
    return <EmptyState title="Gig not found" subtitle="This gig may have been removed." />;
  }

  const accepted = applications.filter((a) => a.status === "accepted");

  return (
    <>
      <Button
        component="a"
        href="/recruiter"
        startIcon={<ArrowBackIcon />}
        sx={{ alignSelf: "flex-start", color: brand.muted }}
      >
        Dashboard
      </Button>

      {/* Gig header */}
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {job.title}
            </Typography>
            <Typography color="text.secondary">
              {job.venue} · {job.location_area}
            </Typography>
          </Box>
          {job.is_urgent && <UrgentBadge />}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
          <Chip label={formatPay(job.pay_aed, job.pay_unit)} sx={{ fontWeight: 700 }} />
          <Chip label={formatStart(job.start_at)} variant="outlined" />
          {job.is_temp && <Chip label="Temp" variant="outlined" />}
        </Stack>
      </Paper>

      {/* Counts */}
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1 }}>
        <Chip
          label={`${applications.length} applicant${applications.length === 1 ? "" : "s"}`}
          sx={{ fontWeight: 700 }}
        />
        {accepted.length > 0 && (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: "1rem !important", color: `${brand.herb} !important` }} />}
            label={`${accepted.length} accepted`}
            sx={{ bgcolor: `${brand.herb}18`, color: brand.herb, fontWeight: 700 }}
          />
        )}
      </Stack>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
          Applicants
        </Typography>

        {applications.length === 0 ? (
          <EmptyState
            icon={<WhatsAppIcon sx={{ fontSize: 40, color: "#25D366" }} />}
            title="No applicants yet"
            subtitle="Urgent gigs get WhatsApp acceptances first — check back shortly."
          />
        ) : (
          <Stack spacing={1.5}>
            {applications.map((app) => {
              const name = app.candidate?.profile?.name ?? "Candidate";
              const headline = app.candidate?.headline;
              const acceptedViaWa = app.status === "accepted" && app.source === "whatsapp";
              return (
                <Paper
                  key={app.id}
                  component="a"
                  href={`/candidates/${app.candidate_profile_id}?job=${job.id}`}
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "box-shadow .2s",
                    // A candidate who locked the gig in over WhatsApp is the headline: green rail + faint tint.
                    ...(acceptedViaWa
                      ? { borderLeft: "4px solid #25D366", bgcolor: "#25D3660d" }
                      : {}),
                    "&:hover": { boxShadow: "0 12px 32px -18px rgba(35,35,37,0.32)" },
                  }}
                >
                  <Avatar
                    src={app.candidate?.profile?.avatar_url ?? undefined}
                    sx={{ bgcolor: acceptedViaWa ? "#128C4B" : brand.teal, width: 48, height: 48 }}
                  >
                    {name.charAt(0)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
                      <Typography sx={{ fontWeight: 700 }} noWrap>
                        {name}
                      </Typography>
                      {app.status === "accepted" && (
                        <Chip
                          size="small"
                          label="Accepted"
                          sx={{ bgcolor: `${brand.herb}18`, color: brand.herb, fontWeight: 700, height: 22 }}
                        />
                      )}
                      {app.status === "declined" && (
                        <Chip size="small" label="Declined" variant="outlined" sx={{ height: 22 }} />
                      )}
                      {app.source === "whatsapp" && (
                        <Chip
                          size="small"
                          icon={<WhatsAppIcon sx={{ fontSize: "0.9rem !important", color: "#25D366 !important" }} />}
                          label="via WhatsApp"
                          sx={{ bgcolor: "#25D3661a", color: "#128C4B", fontWeight: 700, height: 22 }}
                        />
                      )}
                    </Stack>
                    {headline && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {headline}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {app.status === "accepted" ? "Accepted" : "Applied"} {relativeTime(app.updated_at)}
                    </Typography>
                  </Box>
                  <ChevronRightIcon sx={{ color: brand.muted }} />
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </>
  );
}
