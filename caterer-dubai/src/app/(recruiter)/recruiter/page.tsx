import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import AddCircleIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import BoltIcon from "@mui/icons-material/Bolt";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import { createServiceClient } from "@/lib/supabase/server";
import { DEMO_BUSINESS_ID } from "@/lib/demo";
import { getRemainingCredits } from "../actions";
import DashboardGigs, { type DashboardGig } from "@/components/recruiter/DashboardGigs";
import { brand } from "@/theme/brand";
import type { Job } from "@/lib/types";

export default async function RecruiterDashboardPage() {
  const db = createServiceClient();

  const { data: business } = await db
    .from("businesses")
    .select("name")
    .eq("id", DEMO_BUSINESS_ID)
    .maybeSingle();

  const { data: jobsData } = await db
    .from("jobs")
    .select("*")
    .eq("business_id", DEMO_BUSINESS_ID)
    .order("is_urgent", { ascending: false })
    .order("created_at", { ascending: false });
  const jobs = (jobsData ?? []) as unknown as Job[];
  const jobIds = jobs.map((j) => j.id);

  // Applicant counts (initial server render; kept live client-side).
  const counts = new Map<string, { applicants: number; accepted: number; whatsapp: number }>();
  if (jobIds.length > 0) {
    const { data: apps } = await db
      .from("applications")
      .select("job_id, status, source")
      .in("job_id", jobIds);
    for (const a of (apps ?? []) as { job_id: string; status: string; source: string }[]) {
      const cur = counts.get(a.job_id) ?? { applicants: 0, accepted: 0, whatsapp: 0 };
      cur.applicants += 1;
      if (a.status === "accepted") cur.accepted += 1;
      if (a.source === "whatsapp") cur.whatsapp += 1;
      counts.set(a.job_id, cur);
    }
  }

  const gigs: DashboardGig[] = jobs.map((j) => {
    const c = counts.get(j.id);
    return {
      ...j,
      applicantCount: c?.applicants ?? 0,
      acceptedCount: c?.accepted ?? 0,
      whatsappCount: c?.whatsapp ?? 0,
    };
  });

  const remaining = await getRemainingCredits(DEMO_BUSINESS_ID);
  const urgentCount = jobs.filter((j) => j.is_urgent && j.status === "open").length;
  const totalApplicants = [...counts.values()].reduce((s, c) => s + c.applicants, 0);

  return (
    <>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
      >
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Recruiter dashboard
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {business?.name ?? "Atlantis Events"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component="a" href="/post" variant="contained" startIcon={<AddCircleIcon />}>
            Post a gig
          </Button>
          <Button component="a" href="/packages" variant="outlined" startIcon={<CardMembershipIcon />}>
            Buy package
          </Button>
        </Stack>
      </Stack>

      {/* Stat strip */}
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1.5 }}>
        <StatCard
          label="Live gigs"
          value={String(jobs.filter((j) => j.status === "open").length)}
          icon={<WorkOutlineIcon />}
        />
        <StatCard label="Applicants" value={String(totalApplicants)} icon={<GroupIcon />} />
        <StatCard
          label="Job credits left"
          value={remaining >= 999 ? "Unlimited" : String(Math.max(0, remaining))}
          icon={<ConfirmationNumberIcon />}
          accent={remaining <= 0}
        />
      </Stack>

      {/* Low/zero credits nudge */}
      {remaining <= 0 && (
        <Paper
          sx={{
            p: 2,
            bgcolor: `${brand.amber}14`,
            border: `1px solid ${brand.amber}55`,
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <BoltIcon sx={{ color: brand.amber }} />
          <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>
            You&apos;re out of job credits. Buy a package to keep posting.
          </Typography>
          <Button component="a" href="/packages" variant="contained" color="warning">
            See packages
          </Button>
        </Paper>
      )}

      {/* Urgent highlight */}
      {urgentCount > 0 && (
        <Chip
          icon={<BoltIcon />}
          label={`${urgentCount} urgent gig${urgentCount === 1 ? "" : "s"} live — chefs pinged on WhatsApp`}
          sx={{ bgcolor: `${brand.amber}22`, color: brand.navy, fontWeight: 700, alignSelf: "flex-start" }}
        />
      )}

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
          Your gigs
        </Typography>
        <DashboardGigs gigs={gigs} jobIds={jobIds} />
      </Box>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  const tint = accent ? brand.amber : brand.teal;
  return (
    <Paper
      sx={{
        position: "relative",
        overflow: "hidden",
        px: 2.5,
        py: 1.75,
        minWidth: 150,
        flex: { xs: "1 1 45%", sm: "0 0 auto" },
        border: `1px solid ${accent ? brand.amber : brand.line}`,
        // Thin brand accent bar along the top for a crisp dashboard feel.
        "&::before": {
          content: '""',
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: 3,
          background: tint,
        },
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 2,
          mb: 1,
          color: tint,
          bgcolor: `${tint}18`,
          "& svg": { fontSize: "1.15rem" },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 800, lineHeight: 1, color: accent ? brand.amber : "#fff" }}
      >
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Paper>
  );
}
