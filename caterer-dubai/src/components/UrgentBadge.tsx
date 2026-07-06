import Chip from "@mui/material/Chip";
import BoltIcon from "@mui/icons-material/Bolt";
import { brand } from "@/theme/brand";

// Amber URGENT treatment for hot gigs (spec R10 / "start-tomorrow hot jobs").
// Amber = "hot / now" without the alarm of red (red is reserved for errors).
export default function UrgentBadge({ size = "small" }: { size?: "small" | "medium" }) {
  return (
    <Chip
      icon={<BoltIcon sx={{ fontSize: "1rem !important", color: "#241a06 !important" }} />}
      label="URGENT"
      size={size}
      sx={{
        bgcolor: brand.urgent,
        color: "#241a06",
        fontWeight: 800,
        letterSpacing: "0.06em",
        boxShadow: "0 6px 16px -8px rgba(246,166,35,0.65)",
      }}
    />
  );
}
