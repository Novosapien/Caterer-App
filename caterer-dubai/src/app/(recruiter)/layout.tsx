import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import StorefrontIcon from "@mui/icons-material/Storefront";
import RecruiterNav from "@/components/recruiter/RecruiterNav";
import BrandLogo from "@/components/BrandLogo";
import { getSession } from "@/lib/session";
import { loginAsRecruiter } from "@/app/actions/auth";
import { brand } from "@/theme/brand";

// Recruiter portal shell — a dashboard look, distinct from the candidate feed.
export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.role !== "recruiter") {
    return (
      <Box sx={{ minHeight: "100dvh", bgcolor: brand.cream, display: "grid", placeItems: "center", p: 3 }}>
        <Paper sx={{ p: 4, maxWidth: 420, width: "100%", textAlign: "center" }}>
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <BrandLogo dark />
          </Box>
          <StorefrontIcon sx={{ fontSize: 40, color: brand.teal, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Recruiter portal
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Post shifts, manage applicants and ping available chefs on WhatsApp — all from one dashboard.
          </Typography>
          <form action={loginAsRecruiter}>
            <Button type="submit" variant="contained" size="large" fullWidth>
              Enter as recruiter
            </Button>
          </form>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            Demo persona · Sofia @ Atlantis Events
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: brand.cream }}>
      <RecruiterNav />
      <Container
        maxWidth="lg"
        sx={{
          pt: { xs: 2.5, md: 4 },
          // Leave room for the floating bottom bar on mobile.
          pb: { xs: "calc(96px + env(safe-area-inset-bottom))", md: 4 },
        }}
      >
        <Stack spacing={3}>{children}</Stack>
      </Container>
    </Box>
  );
}
