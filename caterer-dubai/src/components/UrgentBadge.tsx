import Box from "@mui/material/Box";
import BoltIcon from "@mui/icons-material/Bolt";
import { brand } from "@/theme/brand";

// Refined URGENT treatment for hot gigs (spec R10 / "start-tomorrow hot jobs").
// A quiet amber-tinted outline tag rather than a loud solid pill — amber = "hot /
// now" without the alarm of red (red is reserved for errors). Matches the inline
// status tag used on the gig feed cards.
export default function UrgentBadge({ size = "small" }: { size?: "small" | "medium" }) {
  const med = size === "medium";
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.35,
        pl: med ? 1 : 0.75,
        pr: med ? 1.4 : 1.1,
        py: med ? 0.5 : 0.35,
        borderRadius: 999,
        bgcolor: "rgba(246,166,35,0.14)",
        color: brand.urgent,
        border: "1px solid rgba(246,166,35,0.38)",
        fontSize: med ? "0.82rem" : "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
        lineHeight: 1,
        "& svg": { fontSize: med ? "1.05rem" : "0.92rem" },
      }}
    >
      <BoltIcon />
      Urgent
    </Box>
  );
}
