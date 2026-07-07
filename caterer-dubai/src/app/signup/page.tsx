import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import BrandLogo from "@/components/BrandLogo";
import AuthForm from "@/components/auth/AuthForm";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";

const PAGE_BG = {
  minHeight: "100dvh",
  color: "#fff",
  backgroundColor: "#08080A",
  backgroundImage: `
    radial-gradient(120% 62% at 50% -10%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 52%),
    linear-gradient(180deg, #141416 0%, #0A0A0C 62%, #0C0C0E 100%)
  `,
};

// Public signup. Browsing never requires an account; this is only for people who want one.
export default function SignupPage() {
  return (
    <Box sx={PAGE_BG}>
      <Container maxWidth="xs" sx={{ pt: { xs: 4, sm: 6 }, pb: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Box component="a" href="/" sx={{ textDecoration: "none", display: "inline-flex" }}>
            <BrandLogo dark />
          </Box>
        </Box>
        <Typography
          component="h1"
          sx={{ fontFamily: display.style.fontFamily, fontWeight: 700, fontSize: "1.9rem", letterSpacing: "-0.02em", textAlign: "center" }}
        >
          Create your account
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", mt: 1, mb: 3 }}>
          Free to join. You can browse gigs anytime without an account.
        </Typography>

        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>

        <Typography sx={{ mt: 2.5, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
          Already have an account?{" "}
          <Box component="a" href="/login" sx={{ color: brand.tealBright, fontWeight: 700, textDecoration: "none" }}>
            Log in
          </Box>
        </Typography>
      </Container>
    </Box>
  );
}
