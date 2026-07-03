# Test Seed — Caterer Dubai Prototype (from review-001)

> Liftable test cases, one block per Requirement ID. Consumed by Stage-7 typed testing.
> Source: spec.md §Test Sources (WE1–WE8, EC1–EC7) + acceptance criteria.

## R1 — Anonymous browsing
- **Input:** Anonymous visitor opens `/jobs`.
- **Expected:** Feed lists ≥20 Dubai gigs; opening "Head Chef · Atlantis The Palm" shows full detail (AED 320/shift, tonight, venue, description) with no login prompt blocking the view.
- **Edge:** Search with no results → essential empty state, no crash (EC7).

## R2 — Progressive phone-first apply
- **Input:** On gig detail, tap Apply; enter name "Yusuf Rahman", mobile "+971501234567"; submit; enter OTP.
- **Expected:** Inline panel expands *below* the gig (page not replaced); OTP verifies; application row created; number stored + WhatsApp-opt-in flag set.
- **Edge:** Wrong OTP → inline error, retry, panel stays open, browsing not blocked (EC1). Collapse without submit → no account created (EC2).

## R3 — Candidate profile (availability + interests + progressive tiers)
- **Input:** Profile → toggle Availability=ON; set interests `["urgent temp","pastry"]`; save.
- **Expected:** `open_to_urgent=true`, interests persisted; candidate becomes eligible for urgent-gig matching.
- **Edge:** Tier-3 CV prompt appears in the candidate's notification inbox after a recruiter opens their profile (see R7).

## R4 — Recruiter upfront login
- **Input:** Recruiter navigates to the portal.
- **Expected:** Auth required before dashboard access (email/password or 1-tap persona).

## R5 — Package mock checkout gates posting
- **Input:** Recruiter "Sofia (Atlantis Events)" with 0 credits → Buy package → "Caterer Pro" → confirm.
- **Expected:** Purchase recorded; job credits granted; posting unlocked; no payment processor called.
- **Edge:** Post with 0 remaining credits → blocked with upsell (EC5).

## R6 — Post gig incl. urgent temp
- **Input:** Post gig "Chef de Partie", Atlantis, AED 320/shift, tonight, is_urgent=true, is_temp=true.
- **Expected:** Gig live; appears in candidate feed flagged Urgent (amber/flame).

## R7 — Applicants + candidate CV
- **Input:** Recruiter opens Applicants for the gig; opens the accepted candidate.
- **Expected:** Applicant list shows the candidate (incl. WhatsApp-sourced); CV/profile viewable. Opening profile fires the candidate's Tier-3 CV prompt (R3).

## R8 — WhatsApp hero (real)
- **Input:** Publish the urgent gig; matched hero chef replies on WhatsApp "what's the pay?" then "I'm in".
- **Expected:** Chef's phone receives a real WhatsApp message; agent answers "AED 320 per shift…"; on "I'm in" an `applications` row is created `status=accepted, source=whatsapp`; recruiter dashboard reflects it near-real-time.
- **Edge:** Not-joined/outside-24h → send fails gracefully, logged, "notification pending" (EC3). Off-topic question → catering-flavoured fallback (EC6).

## R9 — Matching (rules-based)
- **Input:** Publish urgent gig with role "Chef de Partie" in Dubai.
- **Expected match predicate:** `available=true AND open_to_urgent=true AND (gig role/specialism overlaps candidate specialisms/interests) AND same Dubai area (string match; radius_km soft filter, no geocoding)`. Hero chef is selected.
- **Edge:** Zero matches → recruiter sees "0 candidates notified", no error (EC4).

## R10 — Branded mobile-first PWA
- **Input:** Load app on a mobile viewport; install as PWA.
- **Expected:** Installable; catering MUI theme (reskinned TJ tokens: Hanken Grotesk, pill buttons, copper/flame + Dubai-gold, amber urgent badges); Caterer brandmark (not TJ logo).

## R11 — Seed data
- **Expected:** ~20 Dubai gigs across real venues, ~15 candidate CVs, package tiers, demo chef + recruiter accounts, one designated hero available chef; AED currency throughout.

## R12 — Deploy
- **Expected:** Reachable on Vercel; Supabase backs auth + data.

## R13 — 1-tap demo personas
- **Input:** Tap "Login as recruiter" / "Login as chef".
- **Expected:** Recruiter → authenticated recruiter dashboard. Chef → authenticated session as the seeded hero chef (profile + availability preset, OTP skipped); the fresh anonymous→apply path remains separately demoable.

## R14 — Mobile-first responsive
- **Expected:** Every demoed screen renders premium on a phone viewport.

## R15 — Demo reliability
- **Expected:** WhatsApp run-book documented (sandbox join + 24h window); blocked-send graceful path; a screen-recorded fallback clip of the WhatsApp exchange kept as insurance.

## Quality gates
- `npm run build` succeeds; `npm run lint` clean; `tsc --noEmit` clean.
