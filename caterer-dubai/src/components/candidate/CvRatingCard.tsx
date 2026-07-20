"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import CircularProgress from "@mui/material/CircularProgress";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import { rateCvForJob } from "@/app/(candidate)/actions";
import { brand, surfaces } from "@/theme/brand";
import type { CvRating } from "@/lib/types";

function bandColor(score: number): string {
  if (score >= 75) return brand.teal;
  if (score >= 55) return brand.amber;
  return brand.flameBright;
}

// AI "Rate my CV" — a chef taps this on a job to see how well their profile/CV fits
// THIS role (1-100), with strengths, gaps and concrete fixes. Powered by Claude.
export default function CvRatingCard({ jobId }: { jobId: string }) {
  const [rating, setRating] = useState<CvRating | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await rateCvForJob(jobId);
      if (!res.ok || !res.rating) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      setRating(res.rating);
    });
  }

  const ring = rating ? bandColor(rating.score) : brand.teal;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${brand.line}`,
        background: "linear-gradient(180deg, rgba(11,142,147,0.05) 0%, rgba(255,255,255,0) 40%)",
      }}
    >
      {/* Header */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            background: surfaces.tealGradient,
            boxShadow: surfaces.tealGlowShadow,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <AutoAwesomeIcon sx={{ color: "#fff", fontSize: "1.2rem" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>Rate my CV for this role</Typography>
          <Typography variant="body2" color="text.secondary">
            AI compares your profile with this job.
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Idle / first-run CTA */}
      {!rating && (
        <Button
          fullWidth
          size="large"
          variant="contained"
          startIcon={!pending ? <AutoAwesomeIcon /> : undefined}
          onClick={run}
          disabled={pending}
          sx={{ mt: 2, py: 1.5 }}
        >
          {pending ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CircularProgress size={18} thickness={5} sx={{ color: "#fff" }} />
              <span>Reading your CV and the job details…</span>
            </Stack>
          ) : (
            "Rate my CV"
          )}
        </Button>
      )}

      {/* Result */}
      <Collapse in={!!rating} unmountOnExit>
        {rating && (
          <Box sx={{ mt: 2.5 }}>
            {/* Score ring + verdict */}
            <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
              <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={104}
                  thickness={4}
                  sx={{ color: brand.line }}
                />
                <CircularProgress
                  variant="determinate"
                  value={rating.score}
                  size={104}
                  thickness={4}
                  sx={{
                    color: ring,
                    position: "absolute",
                    left: 0,
                    "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 800, color: ring, lineHeight: 1 }}>
                    {rating.score}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    / 100
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "inline-block",
                    px: 1.25,
                    py: 0.4,
                    borderRadius: 999,
                    bgcolor: `${ring}1F`,
                    color: ring,
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    mb: 0.75,
                  }}
                >
                  {rating.verdict}
                </Box>
                <Typography variant="body2" sx={{ color: "#fff", lineHeight: 1.5 }}>
                  {rating.summary}
                </Typography>
              </Box>
            </Stack>

            {rating.strengths.length > 0 && (
              <RatingList
                title="Strengths for this role"
                items={rating.strengths}
                icon={<CheckCircleRoundedIcon sx={{ color: brand.teal, fontSize: "1.15rem" }} />}
              />
            )}
            {rating.gaps.length > 0 && (
              <RatingList
                title="Gaps to address"
                items={rating.gaps}
                icon={<WarningAmberRoundedIcon sx={{ color: brand.amber, fontSize: "1.15rem" }} />}
              />
            )}
            {rating.recommendations.length > 0 && (
              <RatingList
                title="How to improve your CV"
                items={rating.recommendations}
                icon={<TipsAndUpdatesOutlinedIcon sx={{ color: brand.flameBright, fontSize: "1.15rem" }} />}
              />
            )}

            <Button
              variant="text"
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={run}
              disabled={pending}
              sx={{ mt: 2, color: brand.muted }}
            >
              {pending ? "Re-rating…" : "Rate again"}
            </Button>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
}

function RatingList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <Divider sx={{ mb: 1.75 }} />
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {items.map((t, i) => (
          <Stack key={i} direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Box sx={{ mt: "1px", flexShrink: 0 }}>{icon}</Box>
            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
              {t}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
