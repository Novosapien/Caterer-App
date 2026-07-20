import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { surfaces } from "@/theme/brand";

// Premium navy "Stand out. Get more jobs." nudge — shared by the job feed and profile.
export default function CompleteProfileBanner({ sx }: { sx?: object }) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        px: { xs: 1.75, sm: 2 },
        py: 1.5,
        borderRadius: "16px",
        background: surfaces.navyGradient,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        boxShadow: surfaces.navyGlowShadow,
        ...sx,
      }}
    >
      {/* faint warm glow in the corner for depth */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(131,60,159,0.24) 0%, rgba(131,60,159,0) 70%)",
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
          background: surfaces.accentGradient,
          boxShadow: surfaces.accentGlowShadow,
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StarBorderIcon sx={{ fontSize: "1.15rem" }} />
      </Box>
      <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.25 }}>
          Stand out. Get more jobs.
        </Typography>
        <Typography
          sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem", lineHeight: 1.35, mt: 0.25 }}
        >
          Complete your profile to get recommended for top events.
        </Typography>
      </Box>
      <Button
        component="a"
        href="/profile/edit"
        variant="contained"
        color="teal"
        size="small"
        endIcon={<ArrowForwardIcon sx={{ display: { xs: "none", sm: "inline-flex" }, fontSize: "1rem" }} />}
        sx={{
          position: "relative",
          flexShrink: 0,
          fontWeight: 800,
          fontSize: "0.8rem",
          borderRadius: "10px",
          px: { xs: 1.5, sm: 2 },
          py: 0.75,
          whiteSpace: "nowrap",
        }}
      >
        Complete Profile
      </Button>
    </Box>
  );
}
