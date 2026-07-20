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
  // Near-black with a warm orange glow bleeding in from the left, and a faint
  // ember top-right — the premium look from the reference mock.
  backgroundColor: "#08080A",
  backgroundImage: `
    radial-gradient(56% 46% at -6% 44%, rgba(131,60,159,0.32) 0%, rgba(131,60,159,0.10) 32%, rgba(131,60,159,0) 66%),
    radial-gradient(40% 26% at 106% 2%, rgba(131,60,159,0.18) 0%, rgba(131,60,159,0) 60%),
    linear-gradient(180deg, #0C0C0E 0%, #08080A 58%, #0A0A0C 100%)
  `,
  backgroundAttachment: "fixed",
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
          sx={{ fontFamily: display.style.fontFamily, fontWeight: 800, fontSize: { xs: "2.35rem", sm: "2.6rem" }, lineHeight: 1.05, letterSpacing: "-0.03em", textAlign: "center" }}
        >
          Create your <Box component="span" sx={{ color: brand.teal }}>account</Box>
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", mt: 1.25, mb: 3.5, px: 2 }}>
          Free to join. You can browse jobs anytime without an account.
        </Typography>

        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>

        <Typography sx={{ mt: 3, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
          Already have an account?{" "}
          <Box component="a" href="/login" sx={{ color: brand.tealBright, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Log in
          </Box>
        </Typography>
      </Container>
    </Box>
  );
}
