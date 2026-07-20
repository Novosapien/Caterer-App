"use client";

import { useState, useMemo, useRef } from "react";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import GigSuggestionList from "@/components/GigSuggestionList";
import { rankGigs } from "@/lib/gigSuggest";
import { brand } from "@/theme/brand";
import type { JobSuggestion } from "@/lib/types";

// Controlled search box with instant type-ahead. The parent (GigBrowser) owns the query
// value and filters the feed in-memory, so typing narrows the list instantly. The round
// button opens the multi-category Filters panel and badges the active-filter count.
export default function GigSearch({
  value,
  onChange,
  suggestions,
  onFilterClick,
  activeCount,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: JobSuggestion[];
  onFilterClick: () => void;
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => rankGigs(value, suggestions), [value, suggestions]);
  const showDropdown = open && value.trim().length > 0 && matches.length > 0;

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const filtersActive = activeCount > 0;

  return (
    <Box sx={{ position: "relative" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            px: 1.75,
            py: 0.75,
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "#fff",
          }}
        >
          <SearchIcon sx={{ color: "#6A6A6E" }} />
          <InputBase
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setActiveIdx(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search role, venue or area…"
            sx={{ ml: 1, flex: 1, color: "#1A1A1C", "& input::placeholder": { color: "#8A8A8E", opacity: 1 } }}
            inputProps={{ "aria-label": "search gigs", role: "combobox", "aria-expanded": showDropdown }}
          />
          {value && (
            <IconButton
              size="small"
              aria-label="clear search"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange("");
                setActiveIdx(-1);
              }}
              sx={{ color: "#6A6A6E" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Paper>

        <Tooltip title="Filters">
          <IconButton
            onClick={onFilterClick}
            aria-label="open filters"
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: "50%",
              color: filtersActive ? "#FFFFFF" : brand.tealBright,
              bgcolor: filtersActive ? brand.teal : "rgba(146,65,153,0.16)",
              border: `1.5px solid ${filtersActive ? brand.teal : "transparent"}`,
              transition: "all .2s ease",
              "&:hover": { bgcolor: filtersActive ? "#7E3785" : "rgba(146,65,153,0.28)" },
            }}
          >
            <Badge badgeContent={activeCount} color="error" overlap="circular">
              <TuneIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {showDropdown && (
        <GigSuggestionList
          matches={matches}
          query={value}
          activeIdx={activeIdx}
          onHover={setActiveIdx}
          onSelect={() => setOpen(false)}
        />
      )}
    </Box>
  );
}
