import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { brand } from "@/theme/brand";

// Dark tokens (match the profile / rest of the app).
const PAGE = "#252324";
const CARD = "#302E31";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const HAIRLINE = "rgba(255,255,255,0.10)";
const MUTED = "rgba(255,255,255,0.60)";
const WA_GREEN = "#25D366";

// The WhatsApp sandbox number is public. The one-time join code is account-specific
// (from the Twilio console) — set NEXT_PUBLIC_WHATSAPP_JOIN to wire the one-tap button.
const WA_NUMBER_DISPLAY = "+1 737 258 3478";
const WA_NUMBER_E164 = "17372583478";
const WA_JOIN = process.env.NEXT_PUBLIC_WHATSAPP_JOIN ?? "join twilio-trial";
const waLink = `https://wa.me/${WA_NUMBER_E164}?text=${encodeURIComponent(WA_JOIN)}`;

const cardSx = {
  bgcolor: CARD,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 4,
  p: { xs: 2.25, md: 2.75 },
};

const STEPS: { title: string; body: React.ReactNode; action?: React.ReactNode }[] = [
  {
    title: "Turn on availability",
    body: "In your profile, add your mobile number and switch on Available now and Open to urgent. That tells us which shifts to ping you about.",
    action: (
      <Button
        component="a"
        href="/profile/edit"
        variant="outlined"
        size="small"
        startIcon={<EditOutlinedIcon sx={{ fontSize: "1rem" }} />}
        sx={{
          mt: 1.25,
          color: "#fff",
          borderColor: HAIRLINE,
          borderRadius: 999,
          "&:hover": { borderColor: brand.teal, bgcolor: "rgba(239,125,0,0.10)" },
        }}
      >
        Edit profile
      </Button>
    ),
  },
  {
    title: "Connect WhatsApp (one time)",
    body: "Tap the button below to open WhatsApp with the connect message ready to send. This links your number so we can reach you. You only do this once.",
  },
  {
    title: "Get matched",
    body: "When a venue posts an urgent shift that fits your role, area and availability, the Caterer assistant messages you on WhatsApp with the pay, venue, start time and dress code.",
  },
  {
    title: "Reply to accept",
    body: 'Ask anything in the chat (pay, timing, dress code). Reply "yes" to lock the shift in or "no" to pass. Accepting books you instantly and shows up in the venue\'s dashboard.',
  },
];

// Candidate-facing walkthrough: how the WhatsApp gig alerts work + one-time connect.
export default function WhatsAppGuidePage() {
  return (
    <Box sx={{ bgcolor: PAGE, color: "#fff", minHeight: "100dvh" }}>
      <Container maxWidth="sm" sx={{ pt: 1.5, pb: 8 }}>
        <Stack direction="row" sx={{ alignItems: "center", py: 1 }}>
          <Button
            component="a"
            href="/jobs"
            startIcon={<ArrowBackIcon />}
            sx={{ color: MUTED, fontWeight: 600, px: 1, "&:hover": { color: "#fff", bgcolor: "transparent" } }}
          >
            Back
          </Button>
        </Stack>

        {/* Intro */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 0.5, mb: 1.25 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: "rgba(37,211,102,0.14)",
              color: WA_GREEN,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <WhatsAppIcon />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.6rem", sm: "1.9rem" }, letterSpacing: "-0.01em" }}>
            Get gigs on WhatsApp
          </Typography>
        </Stack>
        <Typography sx={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6, mb: 3 }}>
          The moment a matching urgent shift goes live, we message you on WhatsApp and you accept right
          there in the chat. No app to check, no missed shifts. Here is how to switch it on.
        </Typography>

        {/* Numbered steps */}
        <Stack spacing={0} sx={{ ...cardSx, py: { xs: 1, md: 1.5 } }}>
          {STEPS.map((s, i) => (
            <Stack
              key={s.title}
              direction="row"
              spacing={2}
              sx={{ py: 2.25, borderTop: i === 0 ? "none" : `1px solid ${HAIRLINE}` }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  flexShrink: 0,
                  bgcolor: "rgba(239,125,0,0.14)",
                  color: brand.tealBright,
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 800, mb: 0.25 }}>{s.title}</Typography>
                <Typography variant="body2" sx={{ color: MUTED, lineHeight: 1.55 }}>
                  {s.body}
                </Typography>
                {s.action}
              </Box>
            </Stack>
          ))}
        </Stack>

        {/* Connect card — the actionable step 2 detail */}
        <Box sx={{ ...cardSx, mt: 2, borderColor: "rgba(37,211,102,0.35)" }}>
          <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Connect your WhatsApp</Typography>
          <Typography variant="body2" sx={{ color: MUTED, mb: 2 }}>
            Send this exact message to our WhatsApp number to link up:
          </Typography>

          <Stack spacing={1.25}>
            <Box>
              <Typography variant="caption" sx={{ color: MUTED }}>
                Message
              </Typography>
              <Box
                sx={{
                  mt: 0.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.05)",
                  border: `1px solid ${HAIRLINE}`,
                  fontFamily: "monospace",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                {WA_JOIN}
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: MUTED }}>
                To this number
              </Typography>
              <Typography sx={{ mt: 0.25, fontWeight: 800, fontSize: "1.15rem" }}>
                {WA_NUMBER_DISPLAY}
              </Typography>
            </Box>
          </Stack>

          <Button
            component="a"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            size="large"
            startIcon={<WhatsAppIcon />}
            endIcon={<OpenInNewIcon sx={{ fontSize: "1rem" }} />}
            sx={{
              mt: 2,
              py: 1.35,
              fontWeight: 800,
              borderRadius: 999,
              bgcolor: WA_GREEN,
              color: "#08160E",
              "&:hover": { bgcolor: "#1EBE5A" },
            }}
          >
            Open WhatsApp to connect
          </Button>
          <Typography variant="caption" sx={{ display: "block", color: MUTED, mt: 1.25, textAlign: "center" }}>
            We are in preview, so this one-time connect is needed. On full launch, alerts arrive automatically.
          </Typography>
        </Box>

        {/* Good to know */}
        <Box sx={{ ...cardSx, mt: 2 }}>
          <Typography sx={{ fontWeight: 800, mb: 1.5 }}>Good to know</Typography>
          <Stack spacing={1.5}>
            {[
              ["Not getting messages?", "Make sure you have connected (step 2) and your profile is set to Available now."],
              ["Stop any time", 'Reply "STOP" in the chat and we will stop messaging you.'],
              ["It is really you applying", "Accepting on WhatsApp creates a real application the venue sees, same as applying in the app."],
            ].map(([q, a], i) => (
              <Box key={q as string}>
                {i > 0 && <Divider sx={{ borderColor: HAIRLINE, mb: 1.5 }} />}
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{q}</Typography>
                <Typography variant="body2" sx={{ color: MUTED, mt: 0.25 }}>
                  {a}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
