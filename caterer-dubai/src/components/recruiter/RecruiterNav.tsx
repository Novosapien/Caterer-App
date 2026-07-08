"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import AddCircleIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import LogoutIcon from "@mui/icons-material/Logout";
import BrandLogo from "@/components/BrandLogo";
import { logout } from "@/app/actions/auth";
import { brand } from "@/theme/brand";

const LINKS = [
  { href: "/recruiter", label: "Dashboard", icon: <DashboardIcon fontSize="small" /> },
  { href: "/post", label: "Post a gig", icon: <AddCircleIcon fontSize="small" /> },
  { href: "/packages", label: "Packages", icon: <CardMembershipIcon fontSize="small" /> },
];

// Bottom-nav tabs mirror LINKS but with short labels for the floating mobile bar.
const TABS = [
  { href: "/recruiter", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/post", label: "Post", icon: <AddCircleIcon /> },
  { href: "/packages", label: "Packages", icon: <CardMembershipIcon /> },
];

export default function RecruiterNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/recruiter" ? pathname === "/recruiter" : pathname.startsWith(href);

  const activeTab =
    TABS.map((t) => t.href)
      .filter((h) => (h === "/recruiter" ? pathname === h : pathname.startsWith(h)))
      .sort((a, b) => b.length - a.length)[0] ?? "/recruiter";

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <Box component={Link} href="/recruiter" sx={{ textDecoration: "none", display: "inline-flex", mr: 1 }}>
            <BrandLogo dark />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop nav */}
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            {LINKS.map((l) => (
              <Button
                key={l.href}
                component={Link}
                href={l.href}
                startIcon={l.icon}
                variant={l.href === "/post" ? "contained" : "text"}
                color={l.href === "/post" ? "teal" : "inherit"}
                sx={{
                  color: l.href === "/post" ? undefined : isActive(l.href) ? brand.teal : "#fff",
                  fontWeight: isActive(l.href) ? 800 : 700,
                  bgcolor: l.href !== "/post" && isActive(l.href) ? "rgba(239,125,0,0.10)" : undefined,
                }}
              >
                {l.label}
              </Button>
            ))}
            <form action={logout}>
              <Button type="submit" startIcon={<LogoutIcon fontSize="small" />} sx={{ color: brand.muted }}>
                Logout
              </Button>
            </form>
          </Stack>

          {/* Mobile: just a logout control (navigation lives in the floating bottom bar) */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <form action={logout}>
              <IconButton type="submit" aria-label="logout" sx={{ color: brand.muted }}>
                <LogoutIcon />
              </IconButton>
            </form>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Floating bottom bar (mobile only) */}
      <Paper
        elevation={6}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          bottom: "calc(16px + env(safe-area-inset-bottom))",
          left: 16,
          right: 16,
          zIndex: (t) => t.zIndex.appBar + 1,
          borderRadius: 999,
          overflow: "hidden",
          border: `1px solid ${brand.line}`,
        }}
      >
        <BottomNavigation
          value={activeTab}
          showLabels
          sx={{ bgcolor: "transparent", borderRadius: 999 }}
        >
          {TABS.map((t) => (
            <BottomNavigationAction
              key={t.href}
              component={Link}
              href={t.href}
              prefetch
              label={t.label}
              value={t.href}
              icon={t.icon}
              sx={{ "&.Mui-selected": { color: brand.teal } }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
}
