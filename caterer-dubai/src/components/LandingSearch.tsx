"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";
import GigSuggestionList from "@/components/GigSuggestionList";
import { rankGigs } from "@/lib/gigSuggest";
import { brand } from "@/theme/brand";
import type { JobSuggestion } from "@/lib/types";

// Front-and-centre search (TotalJobs / Indeed style) with instant type-ahead: matching
// gigs drop down as you type. Selecting one opens that gig; submitting routes to the
// feed with the query prefilled. No login required.
export default function LandingSearch({ suggestions }: { suggestions: JobSuggestion[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => rankGigs(value, suggestions), [value, suggestions]);
  const showDropdown = open && value.trim().length > 0 && matches.length > 0;

  // Searching always lands on the filtered results list (never a single gig), so
  // "chef de partie" shows every matching gig. Selecting a type-ahead suggestion
  // runs the same search with what was typed.
  function goToResults(query: string) {
    setOpen(false);
    const q = query.trim();
    router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    goToResults(value);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
    // Enter is handled by the form's submit (which respects activeIdx).
  }

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Box component="form" onSubmit={submit} sx={{ width: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 0.75,
            pl: 2,
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "#fff",
            boxShadow: "0 18px 50px -24px rgba(0,0,0,0.6)",
          }}
        >
          <SearchIcon sx={{ color: "#6A6A6E" }} />
          <InputBase
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setActiveIdx(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={onKeyDown}
            placeholder="Job title, role or venue"
            sx={{ ml: 0.5, flex: 1, fontSize: "1.02rem", color: "#1A1A1C", "& input::placeholder": { color: "#8A8A8E", opacity: 1 } }}
            inputProps={{ "aria-label": "search jobs", role: "combobox", "aria-expanded": showDropdown }}
          />
          <Button
            type="submit"
            variant="contained"
            color="teal"
            startIcon={<SearchIcon />}
            sx={{ px: { xs: 2, sm: 3 }, py: 1.25, flexShrink: 0, whiteSpace: "nowrap" }}
          >
            Find Jobs
          </Button>
        </Paper>
      </Box>

      {showDropdown && (
        <GigSuggestionList
          matches={matches}
          query={value}
          activeIdx={activeIdx}
          onHover={setActiveIdx}
          onSelect={() => goToResults(value)}
        />
      )}
    </Box>
  );
}
