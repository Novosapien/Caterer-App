import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { surfaces } from "@/theme/brand";

// Premium navy "Stand out. Get more gigs." nudge — shared by the gig feed and profile.
export default function CompleteProfileBanner({ sx }: { sx?: object }) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        p: 2.75,
        borderRadius: 5,
        background: surfaces.navyGradient,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 2,
        boxShadow: surfaces.navyGlowShadow,
        ...sx,
      }}
    >
      {/* faint cyan glow in the corner for depth */}
      <Box
        sx={{
          position: "absolute",
          top: -50,
          right: -30,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,125,0,0.28) 0%, rgba(239,125,0,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "relative",
          flexShrink: 0,
          width: 52,
          height: 52,
          borderRadius: "14px",
          background: surfaces.accentGradient,
          boxShadow: surfaces.accentGlowShadow,
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StarBorderIcon />
      </Box>
      <Box sx={{ position: "relative", flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>Stand out. Get more gigs.</Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.25 }}>
          Complete your profile and get recommended for top events.
        </Typography>
      </Box>
      <Button
        component="a"
        href="/profile/edit"
        variant="contained"
        color="teal"
        endIcon={<ArrowForwardIcon sx={{ display: { xs: "none", sm: "inline-flex" } }} />}
        sx={{ position: "relative", flexShrink: 0, fontWeight: 800, px: { xs: 1.75, sm: 2.5 } }}
      >
        Complete Profile
      </Button>
    </Box>
  );
}
