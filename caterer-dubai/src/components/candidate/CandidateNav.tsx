"use client";

import { usePathname, useRouter } from "next/navigation";
import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { brand } from "@/theme/brand";

// Fixed bottom navigation for the candidate PWA shell.
const TABS = [
  { label: "Gigs", value: "/jobs", icon: <WorkOutlineIcon /> },
  { label: "Profile", value: "/profile", icon: <PersonOutlineIcon /> },
  { label: "Alerts", value: "/alerts", icon: <NotificationsNoneIcon /> },
];

export default function CandidateNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Match the most specific tab (e.g. /jobs/[id] -> Gigs).
  const active =
    TABS.map((t) => t.value)
      .filter((v) => pathname === v || pathname.startsWith(v + "/"))
      .sort((a, b) => b.length - a.length)[0] ?? "/jobs";

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderTop: (t) => `1px solid ${t.palette.divider}`,
        pb: "env(safe-area-inset-bottom)",
        borderRadius: 0,
      }}
    >
      <BottomNavigation
        value={active}
        onChange={(_, value) => router.push(value)}
        showLabels
        sx={{
          bgcolor: "transparent",
          "& .Mui-selected, & .Mui-selected .MuiBottomNavigationAction-label": {
            color: brand.teal,
          },
        }}
      >
        {TABS.map((t) => (
          <BottomNavigationAction
            key={t.value}
            label={t.label}
            value={t.value}
            icon={t.icon}
            sx={{
              // Bright top indicator bar on the active tab (matches the design).
              "&.Mui-selected::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 32,
                height: 3,
                borderRadius: 999,
                bgcolor: brand.teal,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
