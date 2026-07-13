import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import { brand } from "@/theme/brand";
import { display } from "@/theme/fonts";

// "Get the app" footer banner, echoing caterer.com's own promo but in our near-black +
// orange language, with a real QR (rendered by the caller) and a phone mock showing the
// Dubai feed. Presentational only — the qrSvg string is generated server-side.
export default function AppBanner({ qrSvg }: { qrSvg: string }) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "#0E0E11",
        backgroundImage:
          "radial-gradient(90% 120% at 0% 0%, rgba(239,125,0,0.16) 0%, rgba(239,125,0,0) 55%)",
        p: { xs: 2.75, sm: 4 },
        pr: { xs: 2.75, sm: 4 },
      }}
    >
      <Box sx={{ maxWidth: { xs: "62%", sm: "58%" } }}>
        <Typography
          sx={{
            fontFamily: display.style.fontFamily,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.08,
            fontSize: { xs: "1.35rem", sm: "1.9rem" },
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
          sx={{ mt: 1, color: "rgba(255,255,255,0.6)", fontSize: { xs: "0.85rem", sm: "1rem" }, lineHeight: 1.5 }}
        >
          Scan the QR code and start your job search.
        </Typography>

        {/* QR tile */}
        <Box
          aria-label="Scan to open caterer.com"
          sx={{
            mt: { xs: 2.25, sm: 3 },
            width: { xs: 104, sm: 132 },
            height: { xs: 104, sm: 132 },
            p: 1,
            borderRadius: "14px",
            bgcolor: "#fff",
            boxShadow: "0 12px 30px -14px rgba(0,0,0,0.7)",
            "& svg": { width: "100%", height: "100%", display: "block" },
          }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </Box>

      {/* Phone mock — bleeds off the right edge, tilted, like the reference. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          right: { xs: -34, sm: -10 },
          bottom: { xs: -26, sm: -34 },
          width: { xs: 172, sm: 236 },
          transform: "rotate(-9deg)",
          transformOrigin: "bottom right",
        }}
      >
        <PhoneMock />
      </Box>
    </Box>
  );
}

// A compact, stylised phone showing the Dubai job feed. Light screen (the real app) with
// our orange accent; content is Dubai, not London.
function PhoneMock() {
  return (
    <Box
      sx={{
        borderRadius: "26px",
        bgcolor: "#1a1a1c",
        p: "6px",
        boxShadow: "0 30px 60px -24px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <Box sx={{ borderRadius: "20px", overflow: "hidden", bgcolor: "#FFFFFF", color: "#17171A" }}>
        {/* status bar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1.25, pt: 0.75, pb: 0.25 }}>
          <Box sx={{ fontSize: "0.55rem", fontWeight: 800 }}>9:41</Box>
          <Box sx={{ display: "flex", gap: 0.3, alignItems: "center" }}>
            <Box sx={{ width: 12, height: 6, borderRadius: 1, border: "1px solid #17171A" }} />
          </Box>
        </Box>

        {/* search bar */}
        <Box sx={{ px: 1, pb: 0.75 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.4,
              border: "1px solid #E3E3E6",
              borderRadius: "8px",
              px: 0.6,
              py: 0.5,
            }}
          >
            <SearchIcon sx={{ fontSize: "0.7rem", color: "#8A8A8E" }} />
            <Box sx={{ fontSize: "0.55rem", fontWeight: 600, flex: 1, whiteSpace: "nowrap" }}>Kitchen Assistant</Box>
            <PlaceIcon sx={{ fontSize: "0.65rem", color: brand.teal }} />
            <Box sx={{ fontSize: "0.55rem", fontWeight: 700 }}>Dubai</Box>
          </Box>
        </Box>

        {/* count row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1, pb: 0.5 }}>
          <Box sx={{ fontSize: "0.52rem", fontWeight: 800 }}>823 jobs</Box>
          <Box sx={{ fontSize: "0.5rem", fontWeight: 700, color: brand.teal, textDecoration: "underline" }}>
            Recent searches
          </Box>
        </Box>

        {/* job card */}
        <JobRow title="Junior Sous Chef / Kitchen assistant" company="Address Downtown" posted="Posted today" />

        <Box sx={{ textAlign: "center", fontSize: "0.5rem", color: "#8A8A8E", py: 0.35, bgcolor: "#F5F5F6" }}>
          Recommended for you
        </Box>

        <JobRow title="Catering & Events crew" company="Nikki Beach" posted="Posted today" logoBg={brand.teal} />
        <Box sx={{ height: 10 }} />
      </Box>
    </Box>
  );
}

function JobRow({
  title,
  company,
  posted,
  logoBg = "#EDE7F6",
}: {
  title: string;
  company: string;
  posted: string;
  logoBg?: string;
}) {
  return (
    <Box sx={{ display: "flex", gap: 0.6, px: 1, py: 0.75, borderTop: "1px solid #F0F0F2" }}>
      <Box sx={{ width: 18, height: 18, borderRadius: "5px", bgcolor: logoBg, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ fontSize: "0.56rem", fontWeight: 800, color: brand.tealDeep, lineHeight: 1.15 }}>{title}</Box>
        <Box sx={{ fontSize: "0.5rem", color: "#5A5A5E", mt: 0.15 }}>{company}</Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mt: 0.15 }}>
          <PlaceIcon sx={{ fontSize: "0.55rem", color: "#8A8A8E" }} />
          <Box sx={{ fontSize: "0.5rem", color: "#5A5A5E" }}>Dubai</Box>
          <Box sx={{ fontSize: "0.5rem", color: "#8A8A8E", ml: 0.4 }}>· {posted}</Box>
        </Box>
      </Box>
      <FavoriteBorderIcon sx={{ fontSize: "0.7rem", color: "#B8B8BC", flexShrink: 0 }} />
    </Box>
  );
}
