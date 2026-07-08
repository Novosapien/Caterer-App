import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import { relativeTime } from "@/lib/format";
import type { Application, ApplicationStatus } from "@/lib/types";

// Candidate's "keep track of my applications" section on the profile. Lists the gigs
// they've applied to (from the app or the WhatsApp agent) with a status pill.
const CARD = "#1A1A1C";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.60)";
const HAIRLINE = "rgba(255,255,255,0.10)";

// Status pill styling. Green = a win (accepted); teal = in-progress (applied); muted =
// declined (never red — red is reserved for errors).
const STATUS: Record<ApplicationStatus, { label: string; fg: string; bg: string; bd: string }> = {
  applied: { label: "Applied", fg: "#5EE0CE", bg: "rgba(45,212,191,0.12)", bd: "rgba(45,212,191,0.32)" },
  accepted: { label: "Accepted", fg: "#34D171", bg: "rgba(52,209,113,0.14)", bd: "rgba(52,209,113,0.36)" },
  declined: { label: "Declined", fg: "rgba(255,255,255,0.6)", bg: "rgba(255,255,255,0.05)", bd: HAIRLINE },
};

function StatusPill({ status }: { status: ApplicationStatus }) {
  const s = STATUS[status] ?? STATUS.applied;
  return (
    <Box
      sx={{
        flexShrink: 0,
        px: 1.1,
        py: 0.35,
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.01em",
        color: s.fg,
        bgcolor: s.bg,
        border: `1px solid ${s.bd}`,
      }}
    >
      {s.label}
    </Box>
  );
}

export default function AppliedJobs({ applications }: { applications: Application[] }) {
  const apps = applications.filter((a) => a.job);

  return (
    <Box
      sx={{
        bgcolor: CARD,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 4,
        p: { xs: 2.25, md: 2.5 },
        mb: 2,
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: apps.length ? 1.75 : 1 }}>
        <WorkOutlineIcon sx={{ fontSize: "1.15rem", color: MUTED }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#fff" }}>
          Your applications
        </Typography>
        {apps.length > 0 && (
          <Box
            sx={{
              ml: 0.25,
              px: 0.9,
              py: 0.1,
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: MUTED,
              border: `1px solid ${HAIRLINE}`,
            }}
          >
            {apps.length}
          </Box>
        )}
      </Stack>

      {apps.length === 0 ? (
        <Typography variant="body2" sx={{ color: MUTED }}>
          You haven&apos;t applied to any gigs yet.{" "}
          <Box component="a" href="/jobs" sx={{ color: "#5EE0CE", fontWeight: 700, textDecoration: "none" }}>
            Browse gigs
          </Box>
        </Typography>
      ) : (
        <Box>
          {apps.map((a, i) => {
            const job = a.job!;
            const where = [job.venue, job.location_area].filter(Boolean).join(" · ");
            return (
              <Box
                key={a.id}
                component="a"
                href={`/jobs/${job.id}`}
                sx={{
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  py: 1.4,
                  "&:first-of-type": { pt: 0 },
                  "&:last-of-type": { pb: 0 },
                  // Manual hairline divider (Stack's `divider` prop 500s in a Server Component).
                  borderTop: i === 0 ? "none" : `1px solid ${HAIRLINE}`,
                  transition: "opacity 120ms",
                  "&:hover": { opacity: 0.82 },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {job.title}
                  </Typography>
                  {where && (
                    <Typography
                      variant="caption"
                      sx={{ color: MUTED, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {where}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={0.6} sx={{ alignItems: "center", mt: 0.35 }}>
                    {a.source === "whatsapp" && (
                      <WhatsAppIcon sx={{ fontSize: "0.85rem", color: "#25D366" }} />
                    )}
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                      {a.source === "whatsapp" ? "via WhatsApp · " : ""}
                      Applied {relativeTime(a.created_at)}
                    </Typography>
                  </Stack>
                </Box>
                <StatusPill status={a.status} />
                <ChevronRightIcon sx={{ color: MUTED, fontSize: "1.15rem", flexShrink: 0 }} />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
