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
import UrgentBadge from "./UrgentBadge";
import type { Job } from "@/lib/types";
import { formatAED, formatStart } from "@/lib/format";
import { brand, surfaces } from "@/theme/brand";

// Every card gets imagery: a graceful catering fallback when a gig has no photo,
// so the feed reads consistently premium rather than half-imaged.
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70";

const PAY_SUFFIX: Record<Job["pay_unit"], string> = {
  shift: "/shift",
  hour: "/hr",
  day: "/day",
  year: "/year",
};

// Premium gig content card — horizontal split: image left, details right. Salary reads
// first (bold, high-contrast), then role, then calm metadata. Warm accent is reserved
// for URGENT only. Hover lifts the card, zooms the image, and fills the cyan arrow.
export default function GigCard({ job }: { job: Job }) {
  const img = job.image_url || FALLBACK_IMG;
  return (
    <Card
      sx={{
        overflow: "hidden",
        border: "1px solid",
        borderColor: job.is_urgent ? "rgba(240,85,43,0.30)" : brand.line,
        boxShadow: surfaces.cardShadow,
        transition: "transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s ease, border-color .3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: surfaces.cardShadowHover,
          borderColor: job.is_urgent ? brand.flameBright : "rgba(239,125,0,0.42)",
        },
        "&:hover .gig-img": { transform: "scale(1.07)" },
        "&:hover .gig-arrow": { bgcolor: brand.teal, color: "#fff", borderColor: brand.teal },
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
              className="gig-img"
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "transform .6s cubic-bezier(.2,.7,.3,1)",
              }}
            />
            {job.is_urgent && (
              <Box sx={{ position: "absolute", top: 10, left: 10 }}>
                <UrgentBadge />
              </Box>
            )}
          </Box>

          {/* Details column */}
          <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
            <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
              <Typography component="div" sx={{ fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                <Box component="span" sx={{ fontSize: "1.2rem", letterSpacing: "-0.01em" }}>{formatAED(job.pay_aed)}</Box>
                <Box component="span" sx={{ fontSize: "0.82rem", color: brand.muted, fontWeight: 600 }}>
                  {PAY_SUFFIX[job.pay_unit]}
                </Box>
              </Typography>
              {job.is_temp && (
                <Box
                  sx={{
                    flexShrink: 0,
                    px: 1.1,
                    py: 0.35,
                    borderRadius: 999,
                    bgcolor: brand.surfaceAlt,
                    color: "#fff",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  Temp
                </Box>
              )}
            </Stack>

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
                className="gig-arrow"
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
