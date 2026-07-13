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
  backgroundColor: "#252324",
  backgroundImage: `
    radial-gradient(120% 62% at 50% -10%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 52%),
    linear-gradient(180deg, #2C2A2D 0%, #201E20 62%, #252324 100%)
  `,
};

const demoBtnSx = {
  color: "rgba(255,255,255,0.85)",
  borderColor: "rgba(255,255,255,0.16)",
  "&:hover": { borderColor: brand.teal, bgcolor: "rgba(239,125,0,0.10)" },
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
          sx={{ fontFamily: display.style.fontFamily, fontWeight: 700, fontSize: "1.9rem", letterSpacing: "-0.02em", textAlign: "center" }}
        >
          Welcome back
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
