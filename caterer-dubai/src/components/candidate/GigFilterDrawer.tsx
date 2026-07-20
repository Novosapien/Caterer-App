"use client";

import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import BoltIcon from "@mui/icons-material/Bolt";
import { brand } from "@/theme/brand";
import type { FilterOptions, GigFilters } from "@/lib/gigFilters";

const ACCENT = brand.teal;

// The categories, in display order. Each maps to a multi-select array on GigFilters.
const SECTIONS: { key: keyof FilterOptions; label: string }[] = [
  { key: "areas", label: "Area" },
  { key: "roles", label: "Role" },
  { key: "work", label: "Work type" },
  { key: "pay", label: "Pay" },
  { key: "cuisines", label: "Food type" },
  { key: "settings", label: "Setting" },
];

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.4,
        px: 1.5,
        py: 0.85,
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "0.85rem",
        fontWeight: 600,
        color: selected ? ACCENT : "rgba(255,255,255,0.82)",
        bgcolor: selected ? "rgba(131,60,159,0.14)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${selected ? "rgba(131,60,159,0.5)" : "rgba(255,255,255,0.12)"}`,
        transition: "color .12s, background-color .12s, border-color .12s",
        "& svg": { fontSize: "1rem" },
      }}
    >
      {selected && <CheckIcon />}
      {label}
    </Box>
  );
}

export default function GigFilterDrawer({
  open,
  onClose,
  options,
  filters,
  onChange,
  onClear,
  resultCount,
  activeCount,
}: {
  open: boolean;
  onClose: () => void;
  options: FilterOptions;
  filters: GigFilters;
  onChange: (next: GigFilters) => void;
  onClear: () => void;
  resultCount: number;
  activeCount: number;
}) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "#121215",
            backgroundImage: "none",
            color: "#fff",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderTop: "1px solid rgba(255,255,255,0.10)",
            maxHeight: "88dvh",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", maxHeight: "88dvh" }}>
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 1.25, pb: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 999, bgcolor: "rgba(255,255,255,0.18)", mx: "auto", mb: 1.5 }} />
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>Filters</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {activeCount > 0 && (
                <Box
                  component="button"
                  type="button"
                  onClick={onClear}
                  sx={{
                    border: "none",
                    bgcolor: "transparent",
                    cursor: "pointer",
                    color: ACCENT,
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  Clear all
                </Box>
              )}
              <IconButton onClick={onClose} aria-label="close filters" sx={{ color: "rgba(255,255,255,0.7)" }}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Scrollable body */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
          {/* Urgent — a prominent toggle at the top */}
          <FilterChip
            label="Urgent gigs only"
            selected={filters.urgentOnly}
            onClick={() => onChange({ ...filters, urgentOnly: !filters.urgentOnly })}
          />
          {filters.urgentOnly && (
            <Box sx={{ display: "inline-flex", alignItems: "center", ml: 1, color: brand.urgent, verticalAlign: "middle" }}>
              <BoltIcon sx={{ fontSize: "1.1rem" }} />
            </Box>
          )}

          {SECTIONS.map(({ key, label }) => {
            const opts = options[key];
            if (!opts.length) return null;
            const selected = filters[key];
            return (
              <Box key={key} sx={{ mt: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff", mb: 1.25 }}>
                  {label}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {opts.map((o) => (
                    <FilterChip
                      key={o}
                      label={o}
                      selected={selected.includes(o)}
                      onClick={() => onChange({ ...filters, [key]: toggle(selected, o) })}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Sticky footer */}
        <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid rgba(255,255,255,0.08)", pb: "calc(16px + env(safe-area-inset-bottom))" }}>
          <Box
            component="button"
            type="button"
            onClick={onClose}
            sx={{
              width: "100%",
              height: 52,
              border: "none",
              borderRadius: "14px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "1rem",
              fontWeight: 800,
              color: "#FFFFFF",
              background: `linear-gradient(180deg, ${brand.tealBright} 0%, ${ACCENT} 60%, ${brand.tealDeep} 100%)`,
              boxShadow: "0 14px 34px -16px rgba(131,60,159,0.6)",
            }}
          >
            Show {resultCount} {resultCount === 1 ? "gig" : "gigs"}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
