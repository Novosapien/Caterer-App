import Chip from "@mui/material/Chip";
import BoltIcon from "@mui/icons-material/Bolt";
import { brand } from "@/theme/brand";

// Amber/flame URGENT treatment for hot gigs (spec R10 / "start-tomorrow hot jobs").
export default function UrgentBadge({ size = "small" }: { size?: "small" | "medium" }) {
  return (
    <Chip
      icon={<BoltIcon sx={{ fontSize: "1rem !important", color: "#fff !important" }} />}
      label="URGENT"
      size={size}
      sx={{
        bgcolor: brand.flameBright,
        color: "#fff",
        fontWeight: 800,
        letterSpacing: "0.06em",
        boxShadow: "0 6px 16px -8px rgba(240,85,43,0.7)",
      }}
    />
  );
}
