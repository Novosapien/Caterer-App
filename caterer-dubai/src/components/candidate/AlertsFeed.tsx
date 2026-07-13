"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TuneIcon from "@mui/icons-material/Tune";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BoltIcon from "@mui/icons-material/Bolt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { relativeTime } from "@/lib/format";
import { brand, surfaces } from "@/theme/brand";
import type { AppNotification } from "@/lib/types";

const CARD = "#302E31";
const CARD_BORDER = "rgba(255,255,255,0.09)";
const MUTED = "rgba(255,255,255,0.58)";
const HAIRLINE = "rgba(255,255,255,0.10)";
const ORANGE = brand.teal;

type Tab = "all" | "new" | "read";

// Per-type display treatment (icon + tinted swatch). Orange for profile views to match
// the app's primary accent; amber for urgent gigs; green for accepted applications.
function decorate(n: AppNotification): {
  title: string;
  body?: string;
  icon: React.ReactNode;
  fg: string;
} {
  const p = n.payload ?? {};
  const s = (v: unknown) => (typeof v === "string" ? v : undefined);
  switch (n.type) {
    case "profile_viewed":
      return {
        title: "A recruiter viewed your profile",
        body: s(p.message) ?? s(p.body) ?? "Add your CV to stand out.",
        icon: <UploadFileIcon />,
        fg: ORANGE,
      };
    case "urgent_match":
    case "urgent_gig":
      return {
        title: s(p.title) ?? "Urgent gig near you",
        body: s(p.venue) ?? s(p.body) ?? "You're a match — reply on WhatsApp to grab it.",
        icon: <BoltIcon />,
        fg: brand.amber,
      };
    case "application_accepted":
    case "gig_won":
      return {
        title: s(p.title) ?? "You got the gig!",
        body: s(p.body) ?? s(p.message),
        icon: <CheckCircleRoundedIcon />,
        fg: "#34D171",
      };
    case "message":
      return {
        title: s(p.title) ?? "New message",
        body: s(p.body) ?? s(p.message),
        icon: <ChatBubbleOutlineIcon />,
        fg: brand.amber,
      };
    default:
      return {
        title: s(p.title) ?? "New update",
        body: s(p.body) ?? s(p.message),
        icon: <VisibilityIcon />,
        fg: ORANGE,
      };
  }
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        flex: 1,
        cursor: "pointer",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.85,
        px: 1.5,
        py: 1.05,
        borderRadius: 999,
        fontFamily: "inherit",
        fontSize: "0.92rem",
        fontWeight: 800,
        color: active ? "#fff" : "rgba(255,255,255,0.72)",
        background: active ? surfaces.accentGradient : "transparent",
        boxShadow: active ? "0 10px 22px -12px rgba(239,125,0,0.6)" : "none",
        transition: "color 120ms",
      }}
    >
      {label}
      <Box
        component="span"
        sx={{
          minWidth: 22,
          px: 0.7,
          py: 0.05,
          borderRadius: 999,
          fontSize: "0.78rem",
          fontWeight: 800,
          color: active ? "#fff" : MUTED,
          bgcolor: active ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.08)",
        }}
      >
        {count}
      </Box>
    </Box>
  );
}

function NotificationCard({ n }: { n: AppNotification }) {
  const meta = decorate(n);
  const unread = !n.read;
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 2,
        pl: unread ? 2.5 : 2,
        borderRadius: 4,
        border: `1px solid ${unread ? `${ORANGE}33` : CARD_BORDER}`,
        bgcolor: unread ? "rgba(239,125,0,0.06)" : CARD,
        transition: "border-color 120ms, background-color 120ms",
        "&:hover": { borderColor: `${ORANGE}55` },
      }}
    >
      {unread && (
        <Box
          sx={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: ORANGE,
            boxShadow: `0 0 8px ${ORANGE}`,
          }}
        />
      )}
      <Box
        sx={{
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: meta.fg,
          bgcolor: `${meta.fg}1F`,
          "& svg": { fontSize: "1.35rem" },
        }}
      >
        {meta.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.98rem", color: "#fff", lineHeight: 1.25 }}>
          {meta.title}
        </Typography>
        {meta.body && (
          <Typography variant="body2" sx={{ color: MUTED, mt: 0.15 }}>
            {meta.body}
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", mt: 0.4 }}>
          {relativeTime(n.created_at)}
        </Typography>
      </Box>
      <ChevronRightIcon sx={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
    </Box>
  );
}

export default function AlertsFeed({ notifications }: { notifications: AppNotification[] }) {
  const [tab, setTab] = useState<Tab>("all");

  const counts = useMemo(() => {
    const unread = notifications.filter((n) => !n.read).length;
    return { all: notifications.length, new: unread, read: notifications.length - unread };
  }, [notifications]);

  const shown = useMemo(() => {
    if (tab === "new") return notifications.filter((n) => !n.read);
    if (tab === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, tab]);

  return (
    <>
      {/* Header */}
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.9rem", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Alerts
          </Typography>
          <Typography variant="body2" sx={{ color: MUTED, mt: 0.5 }}>
            Stay updated on who&rsquo;s viewing your profile.
          </Typography>
        </Box>
        <Box
          aria-label="Alert settings"
          sx={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            color: ORANGE,
            border: `1px solid ${ORANGE}44`,
            bgcolor: `${ORANGE}12`,
          }}
        >
          <TuneIcon sx={{ fontSize: "1.2rem" }} />
        </Box>
      </Stack>

      {/* Filter tabs */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          p: 0.6,
          mb: 2.5,
          borderRadius: 999,
          bgcolor: "rgba(255,255,255,0.05)",
          border: `1px solid ${HAIRLINE}`,
        }}
      >
        <FilterPill label="All" count={counts.all} active={tab === "all"} onClick={() => setTab("all")} />
        <FilterPill label="New" count={counts.new} active={tab === "new"} onClick={() => setTab("new")} />
        <FilterPill label="Read" count={counts.read} active={tab === "read"} onClick={() => setTab("read")} />
      </Box>

      {/* List */}
      <Stack spacing={1.25}>
        {shown.map((n) => (
          <NotificationCard key={n.id} n={n} />
        ))}
      </Stack>

      {/* Boost profile visibility CTA */}
      <Box
        sx={{
          mt: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.75,
          p: 2,
          borderRadius: 4,
          border: `1px solid ${CARD_BORDER}`,
          bgcolor: CARD,
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: 52,
            height: 52,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: ORANGE,
            border: `1.5px solid ${ORANGE}66`,
            bgcolor: `${ORANGE}12`,
            "& svg": { fontSize: "1.5rem" },
          }}
        >
          <TrendingUpIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#fff", lineHeight: 1.2 }}>
            Boost your profile visibility
          </Typography>
          <Typography variant="body2" sx={{ color: MUTED, mt: 0.25 }}>
            Complete your profile to increase your chances of getting noticed.
          </Typography>
        </Box>
        <Button
          component="a"
          href="/profile/edit"
          variant="outlined"
          sx={{
            flexShrink: 0,
            color: ORANGE,
            borderColor: `${ORANGE}66`,
            fontWeight: 800,
            whiteSpace: "nowrap",
            "&:hover": { borderColor: ORANGE, bgcolor: `${ORANGE}10` },
          }}
        >
          Improve profile
        </Button>
      </Box>
    </>
  );
}
