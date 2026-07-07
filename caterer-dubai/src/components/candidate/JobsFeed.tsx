"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import GigCard from "@/components/GigCard";
import EmptyState from "@/components/EmptyState";
import GigDateChips from "@/components/candidate/GigDateChips";
import { filterByWhen } from "@/lib/gigDates";
import type { Job } from "@/lib/types";

// The candidate feed's date filter runs entirely on the client: the parent server
// component hands down the full (search/urgent-filtered) list once, and switching
// Today / Tomorrow / This Week just re-filters it in-memory — instant, no round-trip.
export default function JobsFeed({
  baseGigs,
  initialWhen,
  search,
  urgentOnly,
}: {
  baseGigs: Job[];
  initialWhen: string;
  search: string;
  urgentOnly: boolean;
}) {
  const [when, setWhen] = useState(initialWhen);

  const gigs = useMemo(() => filterByWhen(baseGigs, when), [baseGigs, when]);

  return (
    <>
      <Box sx={{ mt: 1.5 }}>
        <GigDateChips value={when} onChange={setWhen} />
      </Box>

      {/* One quiet result count, no sort chrome. */}
      <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", mt: 3, mb: 1.5 }}>
        <Box component="span" sx={{ color: "#fff", fontWeight: 700 }}>
          {gigs.length}
        </Box>{" "}
        {gigs.length === 1 ? "gig" : "gigs"}
        {search ? ` for “${search}”` : " available"}
      </Typography>

      <Stack spacing={2}>
        {gigs.length === 0 ? (
          <EmptyState
            icon={<SearchOffIcon fontSize="inherit" />}
            title="No gigs match"
            subtitle={
              search || when || urgentOnly
                ? "Try widening your filters: a different role, date or area."
                : "No open gigs right now. Check back soon."
            }
          />
        ) : (
          gigs.map((job) => <GigCard key={job.id} job={job} />)
        )}
      </Stack>
    </>
  );
}
