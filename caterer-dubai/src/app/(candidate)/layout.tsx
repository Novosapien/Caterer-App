import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import BrandLogo from "@/components/BrandLogo";
import CandidateNav from "@/components/candidate/CandidateNav";
import CandidateMenu from "@/components/candidate/CandidateMenu";

// Mobile-first candidate shell: solid navy top bar (brand + hamburger menu) + fixed
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
          backgroundColor: "#08080A",
          backgroundImage: "none",
          backdropFilter: "none",
          color: "#fff",
          boxShadow: "none",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar sx={{ minHeight: 60, justifyContent: "space-between" }}>
          <Box component="a" href="/" sx={{ textDecoration: "none" }}>
            <BrandLogo dark />
          </Box>
          <CandidateMenu />
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
