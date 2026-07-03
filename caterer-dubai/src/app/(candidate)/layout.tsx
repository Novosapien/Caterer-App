import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import BrandLogo from "@/components/BrandLogo";
import CandidateNav from "@/components/candidate/CandidateNav";
import { surfaces } from "@/theme/brand";

// Mobile-first candidate shell: solid navy top bar (brand + alerts bell) + fixed
// bottom navigation. Content scrolls between them.
export default function CandidateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: surfaces.navyGradient,
          backdropFilter: "none",
          color: "#fff",
          boxShadow: "0 8px 30px -20px rgba(35,35,37,0.9)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Toolbar sx={{ minHeight: 60, justifyContent: "space-between" }}>
          <Box component="a" href="/" sx={{ textDecoration: "none" }}>
            <BrandLogo dark />
          </Box>
          <IconButton component="a" href="/alerts" aria-label="alerts" sx={{ color: "#fff" }}>
            <Badge color="warning" variant="dot" overlap="circular">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Bottom padding leaves room for the fixed nav (approx 64px + safe area). */}
      <Box component="main" sx={{ pb: "calc(72px + env(safe-area-inset-bottom))" }}>
        {children}
      </Box>

      <CandidateNav />
    </Box>
  );
}
