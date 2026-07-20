"use client";

import Link from "next/link";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BoltIcon from "@mui/icons-material/Bolt";
import type { Job } from "@/lib/types";
import { formatAED, formatStart } from "@/lib/format";
import { brand, surfaces } from "@/theme/brand";

// Small status tag that lives inside the card (top-right), replacing the loud
// amber pill that used to float over the photo. Urgent reads as a quiet amber
// tint; Temp stays neutral. Same footprint so they sit together cleanly.
function StatusTag({
  label,
  icon,
  tone,
}: {
  label: string;
  icon?: React.ReactNode;
  tone: "urgent" | "neutral";
}) {
  const urgent = tone === "urgent";
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 0.35,
        pl: icon ? 0.75 : 1.1,
        pr: 1.1,
        py: 0.35,
        borderRadius: 999,
        bgcolor: urgent ? "rgba(246,166,35,0.14)" : brand.surfaceAlt,
        color: urgent ? brand.urgent : "rgba(255,255,255,0.9)",
        border: `1px solid ${urgent ? "rgba(246,166,35,0.38)" : "transparent"}`,
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        "& svg": { fontSize: "0.92rem" },
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

// Every card gets imagery: a graceful catering fallback when a job has no photo,
// so the feed reads consistently premium rather than half-imaged.
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70";

const PAY_SUFFIX: Record<Job["pay_unit"], string> = {
  shift: "/shift",
  hour: "/hr",
  day: "/day",
  year: "/year",
};

// Premium job content card — horizontal split: image left, details right. Salary reads
// first (bold, high-contrast), then role, then calm metadata. Warm accent is reserved
// for URGENT only. Hover lifts the card, zooms the image, and fills the cyan arrow.
export default function GigCard({ job }: { job: Job }) {
  const img = job.image_url || FALLBACK_IMG;
  return (
    <Card
      sx={{
        overflow: "hidden",
        border: "1px solid",
        borderColor: job.is_urgent ? "rgba(246,166,35,0.32)" : brand.line,
        boxShadow: surfaces.cardShadow,
        transition: "transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s ease, border-color .3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: surfaces.cardShadowHover,
          borderColor: job.is_urgent ? brand.urgent : "rgba(131,60,159,0.42)",
        },
        "&:hover .job-img": { transform: "scale(1.07)" },
        "&:hover .job-arrow": { bgcolor: brand.teal, color: "#fff", borderColor: brand.teal },
      }}
    >
      <CardActionArea component={Link} href={`/jobs/${job.id}`} sx={{ p: 0 }}>
        <Stack direction="row" sx={{ alignItems: "stretch" }}>
          {/* Image column */}
          <Box
            sx={{
              position: "relative",
              width: { xs: 132, sm: 168 },
              flexShrink: 0,
              alignSelf: "stretch",
              overflow: "hidden",
            }}
          >
            <Box
              className="job-img"
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "transform .6s cubic-bezier(.2,.7,.3,1)",
              }}
            />
            {/* Urgent jobs get a slim amber spine on the image edge — a quiet,
                premium signal instead of a pill stuck on the photo. */}
            {job.is_urgent && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: 4,
                  background: `linear-gradient(180deg, ${brand.urgent} 0%, ${brand.gold} 100%)`,
                }}
              />
            )}
          </Box>

          {/* Details column */}
          <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
            {(job.is_urgent || job.is_temp) && (
              <Stack direction="row" spacing={0.75} sx={{ mb: 1, flexWrap: "wrap", rowGap: 0.75 }}>
                {job.is_urgent && <StatusTag tone="urgent" icon={<BoltIcon />} label="Urgent" />}
                {job.is_temp && <StatusTag tone="neutral" label="Temporary" />}
              </Stack>
            )}

            <Typography component="div" sx={{ fontWeight: 800, color: brand.pay, lineHeight: 1 }} noWrap>
              <Box component="span" sx={{ fontSize: "1.2rem", letterSpacing: "-0.01em" }}>{formatAED(job.pay_aed)}</Box>
              <Box component="span" sx={{ fontSize: "0.82rem", color: brand.muted, fontWeight: 600 }}>
                {PAY_SUFFIX[job.pay_unit]}
              </Box>
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.75 }} noWrap>
              {job.title}
            </Typography>

            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                <PlaceIcon sx={{ fontSize: "1.05rem", color: brand.muted, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {job.location_area}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
                <ScheduleIcon sx={{ fontSize: "1.05rem", color: brand.muted, flexShrink: 0 }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {formatStart(job.start_at)}
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ my: 1.25 }} />

            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "#fff", fontWeight: 600, minWidth: 0 }} noWrap>
                {job.venue}
              </Typography>
              <Box
                className="job-arrow"
                sx={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: `1.5px solid ${brand.teal}`,
                  color: brand.teal,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color .25s ease, color .25s ease, border-color .25s ease",
                }}
              >
                <ArrowForwardIcon sx={{ fontSize: "1.05rem" }} />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
