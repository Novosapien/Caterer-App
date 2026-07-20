import type { JobSuggestion } from "./types";

// Rank a job against the typed query: title-startsWith > title-contains > role > venue/area.
function score(j: JobSuggestion, q: string): number {
  const t = j.title.toLowerCase();
  if (t.startsWith(q)) return 0;
  if (t.includes(q)) return 1;
  if (j.role_type.toLowerCase().includes(q)) return 2;
  if (j.venue.toLowerCase().includes(q) || j.location_area.toLowerCase().includes(q)) return 3;
  return -1;
}

// Best matches for the query, most relevant first. Empty query -> no suggestions.
export function rankGigs(value: string, list: JobSuggestion[], max = 7): JobSuggestion[] {
  const q = value.trim().toLowerCase();
  if (!q) return [];
  return list
    .map((j) => ({ j, s: score(j, q) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s)
    .slice(0, max)
    .map((x) => x.j);
}
