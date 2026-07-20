import { Suspense } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import BrandLogo from "@/components/BrandLogo";
import AuthForm from "@/components/auth/AuthForm";
import { loginAsChef, loginAsRecruiter } from "@/app/actions/auth";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";

const PAGE_BG = {
  minHeight: "100dvh",
  color: "#fff",
  // Match the signup screen: near-black with a warm orange glow from the left.
  backgroundColor: "#08080A",
  backgroundImage: `
    radial-gradient(56% 46% at -6% 44%, rgba(131,60,159,0.32) 0%, rgba(131,60,159,0.10) 32%, rgba(131,60,159,0) 66%),
    radial-gradient(40% 26% at 106% 2%, rgba(131,60,159,0.18) 0%, rgba(131,60,159,0) 60%),
    linear-gradient(180deg, #0C0C0E 0%, #08080A 58%, #0A0A0C 100%)
  `,
  backgroundAttachment: "fixed",
};

const demoBtnSx = {
  color: "rgba(255,255,255,0.85)",
  borderColor: "rgba(255,255,255,0.16)",
  "&:hover": { borderColor: brand.teal, bgcolor: "rgba(131,60,159,0.10)" },
};

// Public login. Browsing needs no account; this is for returning users + quick demo access.
export default function LoginPage() {
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
          Welcome <Box component="span" sx={{ color: brand.teal }}>back</Box>
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", mt: 1, mb: 3 }}>
          Log in to your chef or business account.
        </Typography>

        <Suspense>
          <AuthForm mode="login" />
        </Suspense>

        <Typography sx={{ mt: 2.5, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
          New here?{" "}
          <Box component="a" href="/signup" sx={{ color: brand.tealBright, fontWeight: 700, textDecoration: "none" }}>
            Create an account
          </Box>
        </Typography>

        {/* Quick demo access for the pitch — the 1-tap personas. */}
        <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
          or try the demo
        </Divider>
        <Stack direction="row" spacing={1.5}>
          <form action={loginAsChef} style={{ flex: 1 }}>
            <Button type="submit" variant="outlined" fullWidth sx={demoBtnSx}>
              Demo chef
            </Button>
          </form>
          <form action={loginAsRecruiter} style={{ flex: 1 }}>
            <Button type="submit" variant="outlined" fullWidth sx={demoBtnSx}>
              Demo recruiter
            </Button>
          </form>
        </Stack>
      </Container>
    </Box>
  );
}
