"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import AppsIcon from "@mui/icons-material/Apps";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { brand, surfaces } from "@/theme/brand";

// Horizontal, scrollable date filters driving the ?when= param
// (all | today | tomorrow | week). The active chip fills bright orange.
const CHIPS: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: "All Gigs", value: "", icon: <AppsIcon sx={{ fontSize: "1rem" }} /> },
  { label: "Today", value: "today", icon: <CalendarTodayIcon sx={{ fontSize: "0.95rem" }} /> },
  { label: "Tomorrow", value: "tomorrow", icon: <CalendarTodayIcon sx={{ fontSize: "0.95rem" }} /> },
  { label: "This Week", value: "week", icon: <CalendarTodayIcon sx={{ fontSize: "0.95rem" }} /> },
];

export default function GigDateChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const current = searchParams.get("when") ?? "";

  function select(value: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value) params.set("when", value);
    else params.delete("when");
    startTransition(() => {
      router.replace(params.toString() ? `/jobs?${params.toString()}` : "/jobs", { scroll: false });
    });
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        overflowX: "auto",
        pb: 0.5,
        mx: -0.5,
        px: 0.5,
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      {CHIPS.map((c) => {
        const active = current === c.value;
        return (
          <Button
            key={c.label}
            onClick={() => select(c.value)}
            startIcon={c.icon}
            disableRipple
            sx={{
              flexShrink: 0,
              px: 1.75,
              py: 0.85,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: "0.9rem",
              color: active ? "#fff" : "#fff",
              background: active ? surfaces.accentGradient : "rgba(255,255,255,0.05)",
              border: `1px solid ${active ? "transparent" : brand.line}`,
              boxShadow: active ? "0 10px 22px -12px rgba(239,125,0,0.6)" : "none",
              "&:hover": {
                background: active ? surfaces.accentGradient : "rgba(239,125,0,0.14)",
                borderColor: active ? "transparent" : brand.teal,
              },
            }}
          >
            {c.label}
          </Button>
        );
      })}
    </Stack>
  );
}
