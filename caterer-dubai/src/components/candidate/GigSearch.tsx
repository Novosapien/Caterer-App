"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import GigSuggestionList from "@/components/GigSuggestionList";
import { rankGigs } from "@/lib/gigSuggest";
import { brand } from "@/theme/brand";
import type { JobSuggestion } from "@/lib/types";

// Search box with instant type-ahead: as the chef types, a live list of matching gigs
// drops down and refines with each letter. Selecting one opens that gig. The debounced
// ?q= update also narrows the feed below. The orange button toggles urgent-only.
export default function GigSearch({ suggestions }: { suggestions: JobSuggestion[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [, startTransition] = useTransition();
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urgentOnly = searchParams.get("urgent") === "1";

  // Debounce the ?q= param so the feed below narrows as the chef types.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      startTransition(() => {
        router.replace(params.toString() ? `/jobs?${params.toString()}` : "/jobs", {
          scroll: false,
        });
      });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const matches = useMemo(() => rankGigs(value, suggestions), [value, suggestions]);
  const showDropdown = open && value.trim().length > 0 && matches.length > 0;

  function go(id: string) {
    setOpen(false);
    router.push(`/jobs/${id}`);
  }

  function toggleUrgent() {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (urgentOnly) params.delete("urgent");
    else params.set("urgent", "1");
    startTransition(() => {
      router.replace(params.toString() ? `/jobs?${params.toString()}` : "/jobs", { scroll: false });
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      go(matches[activeIdx].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

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
              setValue(e.target.value);
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
                setValue("");
                setActiveIdx(-1);
              }}
              sx={{ color: "#6A6A6E" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Paper>

        <Tooltip title={urgentOnly ? "Showing urgent only" : "Urgent gigs only"}>
          <IconButton
            onClick={toggleUrgent}
            aria-label="toggle urgent-only filter"
            aria-pressed={urgentOnly}
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: "50%",
              color: urgentOnly ? "#fff" : brand.flameBright,
              bgcolor: urgentOnly ? brand.flameBright : brand.flameBrightSoft,
              border: `1.5px solid ${urgentOnly ? brand.flameBright : "transparent"}`,
              transition: "all .2s ease",
              "&:hover": { bgcolor: urgentOnly ? brand.flameDeep : "#FBD9CC" },
            }}
          >
            <TuneIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {showDropdown && (
        <GigSuggestionList
          matches={matches}
          query={value}
          activeIdx={activeIdx}
          onHover={setActiveIdx}
          onSelect={go}
        />
      )}
    </Box>
  );
}
