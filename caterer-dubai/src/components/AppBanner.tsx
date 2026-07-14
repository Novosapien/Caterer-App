import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";

// "Get the app" footer banner. A single phone rises from the bottom of the section and is
// cut off halfway, with the QR code shown on the phone's own screen (a "scan to download"
// screen), so the phone IS the call to action. Presentational only — qrSvg is server-made.
export default function AppBanner({ qrSvg }: { qrSvg: string }) {
  return (
    <Box sx={{ position: "relative", textAlign: "center", pt: { xs: 1, sm: 2 } }}>
      <Typography
        sx={{
          fontFamily: display.style.fontFamily,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          fontSize: { xs: "1.6rem", sm: "2.1rem" },
          color: "#fff",
        }}
      >
        Get the Caterer.com{" "}
        <Box component="span" sx={{ color: brand.teal }}>
          Dubai
        </Box>{" "}
        app
      </Typography>
      <Typography
        sx={{
          mt: 1,
          mx: "auto",
          maxWidth: 360,
          color: "rgba(255,255,255,0.6)",
          fontSize: { xs: "0.9rem", sm: "1rem" },
          lineHeight: 1.5,
        }}
      >
        Scan the code to download and start your job search.
      </Typography>

      {/* Phone stage: the phone hangs from the top and the stage's overflow:hidden cuts it
          off lower down, so it reads as a phone emerging from the bottom of the screen with
          the full QR on show. The stage height is what sets where the cut lands. */}
      <Box
        sx={{
          position: "relative",
          mt: { xs: 3, sm: 3.5 },
          height: { xs: 300, sm: 336 },
          overflow: "hidden",
        }}
      >
        {/* Warm glow behind the phone, so it feels lit from below rather than pasted on. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: { xs: 360, sm: 440 },
            height: { xs: 300, sm: 360 },
            transform: "translateX(-50%)",
            background: `radial-gradient(50% 50% at 50% 60%, ${brand.teal}30 0%, ${brand.teal}00 70%)`,
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: 10,
            transform: "translateX(-50%)",
            width: { xs: 250, sm: 284 },
          }}
        >
          <PhoneQr qrSvg={qrSvg} />
        </Box>
      </Box>
    </Box>
  );
}

// A phone whose screen is a clean "scan to download" panel: brand mark, a heading, the QR
// on a white tile, and the store line. Dark screen so the white QR tile pops on-brand.
function PhoneQr({ qrSvg }: { qrSvg: string }) {
  return (
    <Box
      sx={{
        borderRadius: "40px",
        bgcolor: "#050506",
        p: "12px",
        boxShadow:
          "0 40px 80px -30px rgba(0,0,0,0.9), inset 0 0 0 1.5px rgba(255,255,255,0.16), 0 0 0 1px rgba(0,0,0,0.9)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: "30px",
          overflow: "hidden",
          bgcolor: "#0D0D10",
          color: "#fff",
          px: 2.5,
          pt: 2,
          pb: 5,
          textAlign: "center",
        }}
      >
        {/* Dynamic Island camera tab */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 58,
            height: 18,
            borderRadius: 999,
            bgcolor: "#000",
            zIndex: 3,
          }}
        />

        {/* Brand mark */}
        <Stack direction="row" spacing={0.75} sx={{ mt: 3.25, justifyContent: "center", alignItems: "center" }}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: "5px",
              bgcolor: brand.teal,
              display: "grid",
              placeItems: "center",
              fontSize: "0.7rem",
              fontWeight: 900,
              color: "#0D0D10",
            }}
          >
            C
          </Box>
          <Box sx={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.01em" }}>
            Caterer<Box component="span" sx={{ color: brand.teal }}>.com</Box>
          </Box>
        </Stack>

        <Typography
          sx={{
            mt: 1.5,
            fontFamily: display.style.fontFamily,
            fontWeight: 800,
            fontSize: "1.05rem",
            lineHeight: 1.15,
          }}
        >
          Scan to download
        </Typography>

        {/* QR tile — white so the code stays crisp and scannable on the dark screen. */}
        <Box
          aria-label="Scan to download the Caterer.com Dubai app"
          sx={{
            mt: 1.5,
            mx: "auto",
            width: { xs: 150, sm: 172 },
            height: { xs: 150, sm: 172 },
            p: 1.25,
            borderRadius: "16px",
            bgcolor: "#fff",
            "& svg": { width: "100%", height: "100%", display: "block" },
          }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        <Typography sx={{ mt: 1.5, fontSize: "0.62rem", color: "rgba(255,255,255,0.55)" }}>
          Point your camera at the code
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, justifyContent: "center" }}>
          {["App Store", "Google Play"].map((s) => (
            <Box
              key={s}
              sx={{
                px: 1,
                py: 0.4,
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.16)",
                fontSize: "0.58rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {s}
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
