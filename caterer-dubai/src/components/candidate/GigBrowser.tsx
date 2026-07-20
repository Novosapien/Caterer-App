"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import GigCard from "@/components/GigCard";
import EmptyState from "@/components/EmptyState";
import GigDateChips from "@/components/candidate/GigDateChips";
import GigSearch from "@/components/candidate/GigSearch";
import GigFilterDrawer from "@/components/candidate/GigFilterDrawer";
import { filterByWhen } from "@/lib/gigDates";
import { EMPTY_FILTERS, countActive, deriveOptions, matchesFilters, type GigFilters } from "@/lib/gigFilters";
import type { Job, JobSuggestion } from "@/lib/types";

// Substring match across the fields a chef would search by.
function matchesQuery(j: Job, q: string): boolean {
  return (
    j.title.toLowerCase().includes(q) ||
    j.venue.toLowerCase().includes(q) ||
    j.location_area.toLowerCase().includes(q) ||
    j.role_type.toLowerCase().includes(q)
  );
}

// The whole gig feed as one client component: it holds the full open catalogue and owns
// every filter (search text, Today/Tomorrow/This Week, and the Filters panel's Area /
// Role / Work / Pay / Food type / Setting / Urgent selections). All filtering is in-memory
// so typing and ticking update the list instantly, with no round-trips.
export default function GigBrowser({
  allGigs,
  suggestions,
  initialQuery,
  initialWhen,
  initialUrgent,
}: {
  allGigs: Job[];
  suggestions: JobSuggestion[];
  initialQuery: string;
  initialWhen: string;
  initialUrgent: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [when, setWhen] = useState(initialWhen);
  const [filters, setFilters] = useState<GigFilters>({ ...EMPTY_FILTERS, urgentOnly: initialUrgent });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const options = useMemo(() => deriveOptions(allGigs), [allGigs]);
  const activeCount = countActive(filters);

  const gigs = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? allGigs.filter((j) => matchesQuery(j, q)) : allGigs;
    list = list.filter((j) => matchesFilters(j, filters));
    return filterByWhen(list, when);
  }, [allGigs, query, filters, when]);

  const anyFilter = Boolean(query.trim()) || Boolean(when) || activeCount > 0;

  return (
    <>
      <GigSearch
        value={query}
        onChange={setQuery}
        suggestions={suggestions}
        onFilterClick={() => setDrawerOpen(true)}
        activeCount={activeCount}
      />

      <Box sx={{ mt: 1.5 }}>
        <GigDateChips value={when} onChange={setWhen} />
      </Box>

      <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", mt: 3, mb: 1.5 }}>
        <Box component="span" sx={{ color: "#fff", fontWeight: 700 }}>
          {gigs.length}
        </Box>{" "}
        {gigs.length === 1 ? "job" : "jobs"}
        {query.trim() ? ` for “${query.trim()}”` : " available"}
      </Typography>

      <Stack spacing={2}>
        {gigs.length === 0 ? (
          <EmptyState
            icon={<SearchOffIcon fontSize="inherit" />}
            title="No jobs match your filters"
            subtitle={
              anyFilter
                ? "Try widening your filters: a different role, date or area."
                : "No open jobs right now. Even chefs get a night off. Check back soon."
            }
          />
        ) : (
          gigs.map((job) => <GigCard key={job.id} job={job} />)
        )}
      </Stack>

      <GigFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        options={options}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
        resultCount={gigs.length}
        activeCount={activeCount}
      />
    </>
  );
}
