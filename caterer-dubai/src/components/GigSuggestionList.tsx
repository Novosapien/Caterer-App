"use client";

import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import { formatPay } from "@/lib/format";
import { brand } from "@/theme/brand";
import type { JobSuggestion } from "@/lib/types";

// Bold + colour the matched slice of the title so the user sees why it matched.
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <Box component="span" sx={{ color: brand.teal, fontWeight: 800 }}>
        {text.slice(idx, idx + q.length)}
      </Box>
      {text.slice(idx + q.length)}
    </>
  );
}

// Shared instant type-ahead dropdown. Rendered inside a position:relative wrapper,
// absolutely positioned below the search box. Used by the landing search and job feed.
export default function GigSuggestionList({
  matches,
  query,
  activeIdx,
  onHover,
  onSelect,
}: {
  matches: JobSuggestion[];
  query: string;
  activeIdx: number;
  onHover: (i: number) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Paper
      elevation={0}
      role="listbox"
      // Keep the input focused so a row's onClick fires before blur closes the list.
      onMouseDown={(e) => e.preventDefault()}
      sx={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        zIndex: 1300,
        overflow: "hidden",
        maxHeight: 380,
        overflowY: "auto",
        borderRadius: 4,
        bgcolor: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 26px 60px -20px rgba(0,0,0,0.7)",
      }}
    >
      {matches.map((j, i) => (
        <Box
          key={j.id}
          component="button"
          type="button"
          role="option"
          aria-selected={i === activeIdx}
          onMouseEnter={() => onHover(i)}
          onClick={() => onSelect(j.id)}
          sx={{
            width: "100%",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: 1.75,
            py: 1.25,
            border: "none",
            borderBottom: i < matches.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
            bgcolor: i === activeIdx ? brand.tealSoft : "transparent",
            cursor: "pointer",
            transition: "background-color .12s ease",
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              color: brand.teal,
              bgcolor: `${brand.teal}14`,
            }}
          >
            <WorkOutlineIcon sx={{ fontSize: "1.1rem" }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: brand.navy, lineHeight: 1.2 }} noWrap>
              <Highlight text={j.title} query={query} />
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: "block", color: "#6A6A6E" }}>
              {j.venue} · {j.location_area}
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0, textAlign: "right" }}>
            {j.is_urgent && (
              <Typography
                variant="caption"
                sx={{ display: "block", color: "#5F2873", fontWeight: 800, letterSpacing: "0.04em" }}
              >
                URGENT
              </Typography>
            )}
            <Typography variant="caption" sx={{ fontWeight: 700, color: brand.navy }}>
              {formatPay(j.pay_aed, j.pay_unit)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Paper>
  );
}
