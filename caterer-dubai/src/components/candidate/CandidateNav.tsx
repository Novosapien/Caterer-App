"use client";

import { usePathname, useRouter } from "next/navigation";
import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { md } from "@/theme/brand";

// Material Design 3 navigation bar for the candidate PWA shell. The active tab shows the
// MD3 active-indicator pill (styled globally in theme.ts on the selected icon).
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
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: md.surfaceContainer,
        borderTop: `1px solid ${md.outlineVariant}`,
        pb: "env(safe-area-inset-bottom)",
        borderRadius: 0,
      }}
    >
      <BottomNavigation
        value={active}
        onChange={(_, value) => router.push(value)}
        showLabels
        sx={{ bgcolor: "transparent" }}
      >
        {TABS.map((t) => (
          <BottomNavigationAction key={t.value} label={t.label} value={t.value} icon={t.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
