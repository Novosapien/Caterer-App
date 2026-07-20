import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// One-time WhatsApp sandbox connect. Number is public; the join phrase is account-specific
// and matches the /whatsapp walkthrough (NEXT_PUBLIC_WHATSAPP_JOIN keeps both in sync).
const WA_NUMBER_E164 = "17372583478";
const WA_JOIN = process.env.NEXT_PUBLIC_WHATSAPP_JOIN ?? "join twilio-trial";
const waLink = `https://wa.me/${WA_NUMBER_E164}?text=${encodeURIComponent(WA_JOIN)}`;

const WA_GREEN = "#25D366";

// Tap-to-connect box for the job feed: opens WhatsApp with the join message pre-filled so any
// user can switch on job alerts in one tap. "How it works" links to the full walkthrough.
export default function WhatsAppConnectBanner({ sx }: { sx?: object }) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        px: { xs: 1.75, sm: 2 },
        py: 1.5,
        borderRadius: "16px",
        background: "linear-gradient(135deg, #0A3B2C 0%, #0D6B54 100%)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        boxShadow: "0 18px 40px -24px rgba(13,107,84,0.7)",
        ...sx,
      }}
    >
      {/* faint green glow in the corner for depth */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,211,102,0.28) 0%, rgba(37,211,102,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "relative",
          flexShrink: 0,
          width: 38,
          height: 38,
          borderRadius: "10px",
          bgcolor: WA_GREEN,
          boxShadow: "0 6px 16px -6px rgba(37,211,102,0.8)",
          color: "#08160E",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WhatsAppIcon sx={{ fontSize: "1.2rem" }} />
      </Box>
      <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.25 }}>
          Get jobs on WhatsApp
        </Typography>
        <Typography
          sx={{ color: "rgba(255,255,255,0.68)", fontSize: "0.78rem", lineHeight: 1.35, mt: 0.25 }}
        >
          Message us once. Then we tell you as soon as a job that fits you appears.{" "}
          <Box
            component="a"
            href="/whatsapp"
            sx={{
              color: "#8FF0C0",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            How it works
          </Box>
        </Typography>
      </Box>
      <Button
        component="a"
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        variant="contained"
        size="small"
        endIcon={
          <ArrowForwardIcon sx={{ display: { xs: "none", sm: "inline-flex" }, fontSize: "1rem" }} />
        }
        sx={{
          position: "relative",
          flexShrink: 0,
          fontWeight: 800,
          fontSize: "0.8rem",
          borderRadius: "10px",
          px: { xs: 1.5, sm: 2 },
          py: 0.75,
          whiteSpace: "nowrap",
          bgcolor: WA_GREEN,
          color: "#08160E",
          boxShadow: "none",
          "&:hover": { bgcolor: "#1EBE5A", boxShadow: "none" },
        }}
      >
        Connect
      </Button>
    </Box>
  );
}
