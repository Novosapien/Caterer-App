"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GroupIcon from "@mui/icons-material/Group";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import UrgentBadge from "@/components/UrgentBadge";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { formatPay, formatStart } from "@/lib/format";
import { brand } from "@/theme/brand";
import type { Job } from "@/lib/types";

export interface DashboardGig extends Job {
  applicantCount: number;
  acceptedCount: number;
  whatsappCount: number;
}

// Live dashboard list. Subscribes to `applications` via Supabase Realtime so new
// WhatsApp acceptances reflect within seconds; falls back to a poll every 5s.
export default function DashboardGigs({ gigs, jobIds }: { gigs: DashboardGig[]; jobIds: string[] }) {
  const [rows, setRows] = useState<DashboardGig[]>(gigs);
  const [pulse, setPulse] = useState<Record<string, boolean>>({});

  // Sync when the server passes a fresh `gigs` prop (e.g. after posting) — React's
  // "adjust state during render" pattern, not a setState-in-effect.
  const [prevGigs, setPrevGigs] = useState(gigs);
  if (prevGigs !== gigs) {
    setPrevGigs(gigs);
    setRows(gigs);
  }

  const refresh = useCallback(async () => {
    if (jobIds.length === 0) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("applications")
      .select("job_id, status, source")
      .in("job_id", jobIds);
    if (!data) return;
    const byJob = new Map<string, { applicants: number; accepted: number; whatsapp: number }>();
    for (const a of data as { job_id: string; status: string; source: string }[]) {
      const cur = byJob.get(a.job_id) ?? { applicants: 0, accepted: 0, whatsapp: 0 };
      cur.applicants += 1;
      if (a.status === "accepted") cur.accepted += 1;
      if (a.source === "whatsapp") cur.whatsapp += 1;
      byJob.set(a.job_id, cur);
    }
    setRows((prev) =>
      prev.map((g) => {
        const c = byJob.get(g.id);
        const next = {
          ...g,
          applicantCount: c?.applicants ?? 0,
          acceptedCount: c?.accepted ?? 0,
          whatsappCount: c?.whatsapp ?? 0,
        };
        if (c && c.accepted > g.acceptedCount) {
          setPulse((p) => ({ ...p, [g.id]: true }));
          setTimeout(() => setPulse((p) => ({ ...p, [g.id]: false })), 2500);
        }
        return next;
      }),
    );
  }, [jobIds]);

  useEffect(() => {
    if (jobIds.length === 0) return;
    const supabase = createClient();
    const channel = supabase
      .channel("recruiter-applications")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => {
        refresh();
      })
      .subscribe();
    const poll = setInterval(refresh, 5000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [jobIds, refresh]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<WorkOutlineIcon sx={{ fontSize: 40, color: "teal.main" }} />}
        title="No gigs posted yet"
        subtitle="Post your first shift to start receiving applicants."
      />
    );
  }

  return (
    <Stack spacing={1.5}>
      {rows.map((g) => (
        <Card
          key={g.id}
          sx={{
            overflow: "hidden",
            borderLeft: g.is_urgent ? `4px solid ${brand.amber}` : "4px solid transparent",
            transition: "box-shadow .35s ease, transform .35s ease",
            // When a WhatsApp accept lands, the card lifts + glows WhatsApp-green so
            // the demo moment (chef says YES) is unmistakable on the dashboard.
            ...(pulse[g.id]
              ? {
                  transform: "translateY(-2px) scale(1.012)",
                  boxShadow: `0 0 0 3px #25D36688, 0 22px 48px -22px rgba(37,211,102,0.55)`,
                }
              : {}),
          }}
        >
          <CardActionArea component={Link} href={`/jobs/${g.id}/applicants`} sx={{ p: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                  {g.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {g.venue}
                </Typography>
              </Box>
              {g.is_urgent && <UrgentBadge />}
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 0.5 }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <PlaceIcon sx={{ fontSize: "1rem", color: brand.herb }} />
                <Typography variant="body2" color="text.secondary">
                  {g.location_area}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <ScheduleIcon sx={{ fontSize: "1rem", color: brand.herb }} />
                <Typography variant="body2" color="text.secondary">
                  {formatStart(g.start_at)}
                </Typography>
              </Stack>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}
            >
              <Typography sx={{ fontWeight: 800, color: brand.pay, mr: 0.5 }}>
                {formatPay(g.pay_aed, g.pay_unit)}
              </Typography>
              <Chip
                size="small"
                icon={<GroupIcon sx={{ fontSize: "1rem !important" }} />}
                label={`${g.applicantCount} applicant${g.applicantCount === 1 ? "" : "s"}`}
                variant="outlined"
              />
              {g.acceptedCount > 0 && (
                <Chip
                  size="small"
                  label={`${g.acceptedCount} accepted`}
                  sx={{ bgcolor: `${brand.herb}18`, color: brand.herb, fontWeight: 700 }}
                />
              )}
              {g.whatsappCount > 0 && (
                <Chip
                  size="small"
                  icon={<WhatsAppIcon sx={{ fontSize: "1rem !important", color: "#25D366 !important" }} />}
                  label="via WhatsApp"
                  sx={{ bgcolor: "#25D3661a", color: "#128C4B", fontWeight: 700 }}
                />
              )}
            </Stack>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}
