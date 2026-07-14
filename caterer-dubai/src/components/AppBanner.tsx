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
        // No card: the writing, QR and phone sit directly on the page background.
        // NOTE: no overflow:hidden here — the phone must bleed past the content column's
        // side padding to the true screen edge. The page root clips horizontal overflow.
        py: { xs: 1, sm: 2 },
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
          Scan the QR code and start{" "}
          {/* Keep "your job search." as one unit so "search" never dangles on its own line. */}
          <Box component="span" sx={{ whiteSpace: "nowrap" }}>
            your job search.
          </Box>
        </Typography>

        {/* QR tile */}
        <Box
          aria-label="Scan to open caterer.com"
          sx={{
            mt: { xs: 2.25, sm: 3 },
            width: { xs: 104, sm: 132 },
            height: { xs: 104, sm: 132 },
            p: 1,
            borderRadius: "12px",
            bgcolor: "#fff",
            "& svg": { width: "100%", height: "100%", display: "block" },
          }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </Box>

      {/* Phone mock — bleeds off the right edge, tilted, like the reference. Its top and
          left edges fade to transparent so it emerges from the page like the hero chef,
          instead of starting on a hard cut-off. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          // Jam the bottom-right corner well past the screen corner on every width so the
          // phone's solid body fills the exact corner — the tilt would otherwise leave a
          // black triangle right at the corner where the rotated edges pull away from it.
          right: { xs: -56, sm: -60 },
          bottom: { xs: -58, sm: -64 },
          width: { xs: 184, sm: 248 },
          // Gentle left lean, rising out of the corner.
          transform: "rotate(-6deg)",
          transformOrigin: "bottom right",
          // Soften just the top and left edges into a thin feather (no hard cut-off)
          // while keeping the screen crisp — intersecting the two edge gradients means
          // only the outer edges fade, not the whole corner into a blurry haze.
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 9%), linear-gradient(to right, transparent 0%, #000 7%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 9%), linear-gradient(to right, transparent 0%, #000 7%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
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
        borderRadius: "32px",
        bgcolor: "#050506",
        p: "11px",
        boxShadow:
          "0 30px 60px -24px rgba(0,0,0,0.85), inset 0 0 0 1.5px rgba(255,255,255,0.14), 0 0 0 1px rgba(0,0,0,0.9)",
      }}
    >
      <Box sx={{ position: "relative", borderRadius: "22px", overflow: "hidden", bgcolor: "#FFFFFF", color: "#17171A" }}>
        {/* Dynamic Island camera tab */}
        <Box
          sx={{
            position: "absolute",
            top: 5,
            left: "50%",
            transform: "translateX(-50%)",
            width: 46,
            height: 15,
            borderRadius: 999,
            bgcolor: "#050506",
            zIndex: 3,
          }}
        />
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

        {/* job feed — a realistic list that runs off the bottom edge, giving the phone a
            true tall aspect ratio rather than a stubby, square-ish frame. */}
        <JobRow title="Junior Sous Chef / Kitchen assistant" company="Address Downtown" posted="Posted today" />
        <JobRow title="Commis Chef" company="Jumeirah Al Qasr" posted="Posted today" logoBg="#FCE4D6" />

        <Box sx={{ textAlign: "center", fontSize: "0.5rem", color: "#8A8A8E", py: 0.35, bgcolor: "#F5F5F6" }}>
          Recommended for you
        </Box>

        <JobRow title="Catering & Events crew" company="Nikki Beach" posted="Posted today" logoBg={brand.teal} />
        <JobRow title="Waiter / Waitress" company="Zuma DIFC" posted="Posted 1d ago" logoBg="#E3F2E9" />
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
