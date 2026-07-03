# Caterer.com Dubai — Reimagined (Pitch Prototype)

## Meta

| Field | Value |
|-------|-------|
| Type | hybrid (frontend + backend + agent) |
| Repo | `caterer-dubai/` (new subfolder under `/Users/MaxKingaby/Programming/Total Jobs/`, alongside `specs/`) |
| Status | draft |
| Created | 2026-07-01 |
| Discovery | `specs/2026-07-01-caterer-dubai-prototype/discovery.md` |
| Target | Friday 2026-07-03 (soft — may bleed into following week) |
| Build mode | Team mode (parallel streams) |

## Overview

A high-fidelity, clickable **pitch prototype** of a reimagined **Caterer.com (Dubai)** — a mobile-first PWA marketplace for the catering world (chefs, waiters, crew on one side; hotels, eventing companies, recruiters on the other). Built to walk Total Jobs through the whole product end-to-end, both sides, and prove out their own stated vision: an urgency-first, mobile/WhatsApp-native, agent-assisted hospitality marketplace.

All data is **simulated/seeded** and all flows are **happy-path rails** — with one deliberate exception: a genuinely **real, Claude-powered WhatsApp agent** (via Twilio sandbox) that pings *available* chefs about urgent temp gigs and closes the loop conversationally. That single real integration is the demo's climax and the reason the whole simulated marketplace feels alive.

The candidate experience uses **progressive/just-in-time authentication** (browse freely → phone-only inline apply → progressive profiling), because forcing on-the-go chefs to sign up early is the exact friction the current Caterer.com gets wrong. Recruiters log in upfront because they transact.

## Skills

Load these skills before starting:
- `ui-ux-pro-max` — MUI theming, mobile-first UI, component patterns, catering palette
- `mobile-pwa-migration` — mobile-responsive + PWA patterns (transferable)
- `prompt-engineering` — WhatsApp agent system prompt
- `claude-api` — Claude/Anthropic SDK integration for the agent
- `agent-spec-builder` / `agent-implementation-builder` — for the WhatsApp agent chunk (see Execution Plan C11; separate agent spec)

## Requirements

- **R1:** Anonymous candidates can browse and search all Dubai gigs and view full gig detail with **no login** — no wall blocks discovery.
- **R2:** Progressive candidate auth — at the point of "Apply", an **inline** panel (not a full-screen takeover, not a modal, not a copilot popup) expands *under the gig* asking only for **name + mobile number**; a **phone OTP** (WhatsApp/SMS) creates the account silently and opts the chef into the WhatsApp channel.
- **R3:** Candidate profile with an **availability toggle**, an **open-to-urgent** flag, and **role interests** (specialisms/cuisine), plus a progressive-profiling ladder (Tier 2 enrichment fields, Tier 3 CV/certs). **Tier-3 trigger (prototype):** when a recruiter opens a candidate's profile (R7), a notification ("a recruiter viewed your profile — add your CV") is written to that candidate's inbox; the Tier-3 fields are also always available in the profile. There is **no separate shortlist/interview feature** in scope.
- **R4:** Recruiters/businesses log in **upfront** and land on a portal dashboard.
- **R5:** Recruiters buy a **package** via **mock checkout** (no real payment); packages gate how many gigs they can post / CVs they can view.
- **R6:** Recruiters post gigs, including flagging a gig as **URGENT temp** ("start tonight/tomorrow" hot jobs).
- **R7:** Recruiters view a gig's **applicants** and open a candidate's **CV/profile**.
- **R8:** **WhatsApp hero (real):** publishing an URGENT gig sends a **real WhatsApp message** to matched *available* candidates; a **conversational Claude agent** answers gig questions (pay/venue/time/dress code) and handles **accept/decline**; an acceptance is written to the DB and reflected on the recruiter dashboard in near-real-time. *(Agent internals specified via `agent-spec-builder`.)*
- **R9:** **Matching** is rules-based (no ML). For an `is_urgent` gig, a candidate matches iff: `available=true AND open_to_urgent=true AND (gig.role_type overlaps candidate.specialisms/interests) AND same Dubai area`. **Area match is a string comparison on `location_area`** (e.g. "Palm Jumeirah") — **no geocoding**; `radius_km` is a soft/decorative filter only for the prototype. Non-urgent gigs relax the `open_to_urgent` requirement.
- **R10:** Branded **mobile-first PWA** (installable, notification-capable) using an **MUI theme** that reskins the Total Jobs design system for catering (see Architecture), with real food/venue imagery.
- **R11:** **Seed data:** ~20 Dubai gigs across real venues, ~15 candidate profiles/CVs, package tiers, demo accounts — AED currency, Dubai locations.
- **R12:** Deployed and reachable on **Vercel**, backed by **Supabase** (Postgres + Auth).
- **R13:** **1-tap demo personas** for the walkthrough (real Supabase auth underneath). **"Login as recruiter"** → authenticated recruiter session. **"Login as chef"** → authenticated session as the **seeded hero chef** (profile + availability + open-to-urgent preset, phone on file), **skipping the phone-OTP step**. The fresh **anonymous → inline apply → OTP** path (R1/R2) remains separately demoable — the persona shortcut does not replace it.

**Non-functional:**
- **R14:** Mobile-first responsive; every demoed screen looks premium on a phone viewport.
- **R15:** Demo reliability — the WhatsApp hero must have a documented run-book (Twilio sandbox join + 24h window), a graceful failure path if a send is blocked, and a **screen-recorded fallback clip** of the WhatsApp exchange kept as insurance against live network/API failure on stage.

## Out of Scope

- Real payment processing / payouts / invoicing (mock checkout only)
- Meta WhatsApp Business API / production WhatsApp (Twilio **sandbox** only)
- ML/recommendation matching (rules + seeded lists)
- Admin / moderation / analytics dashboards
- i18n / multi-language / multi-region (Dubai only)
- Password reset, deep account settings, transactional email flows, recruiter KYC/onboarding
- Real recruiter signup funnel (demo accounts suffice)
- Real in-app messaging inbox beyond the WhatsApp thread
- Non-happy-path error states and empty states beyond the essentials listed in Test Sources
- Real-time infra beyond what Supabase Realtime/polling gives for the dashboard reflection

## Test Sources

### Worked Examples (happy-path contract)

| # | Requirement | Input / Trigger | Expected Output / Behavior |
|---|-------------|-----------------|----------------------------|
| WE1 | R1 | Anonymous visitor opens `/jobs` | Feed shows ≥20 Dubai gigs; opening "Head Chef · Atlantis The Palm" shows full detail (AED 320/shift, tonight start, venue, description) with no login prompt blocking the view |
| WE2 | R2 | On the gig detail, tap **Apply**; enter name "Yusuf Rahman", mobile "+971501234567", submit; enter the OTP received | An inline panel expands *below* the gig summary (page not replaced); OTP verifies; an application row is created; candidate is opted into WhatsApp |
| WE3 | R3 | Candidate profile → toggle **Availability = ON**; select interests `["urgent temp","pastry"]`; save | Profile persists availability=true and interests; candidate now eligible for urgent-gig matching |
| WE4 | R5 | Recruiter "Sofia (Atlantis Events)" with 0 job credits opens **Buy package** → selects "Caterer Pro" → confirms mock checkout | Purchase recorded; job credits granted; posting is now unlocked; no real payment processor is called |
| WE5 | R6 | Recruiter posts gig: title "Chef de Partie", venue "Atlantis The Palm", pay AED 320/shift, start "tonight", **is_urgent=true, is_temp=true** | Gig is live and appears in the candidate feed flagged **Urgent** |
| WE6 | R8, R9 | Publishing the WE5 urgent gig; matched available candidate (from WE3) replies on WhatsApp "what's the pay?" then "I'm in" | Candidate's phone receives a real WhatsApp message about the gig; agent replies "AED 320 per shift…"; on "I'm in", an application row is created with `status=accepted, source=whatsapp` |
| WE7 | R7 | Recruiter opens **Applicants** for the WE5 gig | The accepted candidate appears; opening them shows their CV/profile |
| WE8 | R13 | On the landing screen, tap **"Login as recruiter"** | Authenticated into the recruiter dashboard as the seeded demo recruiter, no manual credential entry |

### Edge Cases (boundaries & failure modes)

| # | Requirement | Condition / Input | Expected Handling |
|---|-------------|-------------------|-------------------|
| EC1 | R2 | Wrong OTP code entered | Inline error, retry allowed; panel stays open; browsing not blocked |
| EC2 | R2 | User expands the apply panel then collapses it without submitting | No account created; user keeps browsing freely |
| EC3 | R8, R15 | Candidate hasn't joined the Twilio sandbox or is outside the 24h window | Outbound send fails gracefully; logged; dashboard shows "notification pending" (no crash); run-book covers pre-join |
| EC4 | R9 | Urgent gig matches zero available candidates | Recruiter sees "0 candidates notified"; no error |
| EC5 | R5 | Recruiter posts with 0 remaining credits | Posting blocked with an upsell prompt to buy a package |
| EC6 | R8 | Candidate asks the agent something off-topic ("what's the weather?") | Graceful, catering-flavoured fallback that steers back to the gig |
| EC7 | R1 | Search yields no matching gigs | Essential empty state ("no gigs match — try widening your search") |

## Architecture

### Stack (hard constraint — from discovery)
- **Next.js** (App Router, TypeScript) on **Vercel**
- **MUI (Material UI) v6** for all UI
- **Supabase** — Postgres + Auth (phone OTP for candidates; email/password for recruiter demo accounts) + optional Realtime for dashboard reflection
- **WhatsApp agent = a SEPARATE service** — Python **FastAPI + LangGraph**, **Claude Sonnet 5**, hosted on **Cloud Run** (`min-instances=1`). Fully specified in [`agent-spec/`](agent-spec/manifest.yaml). The Next.js app does **not** host the agent or the Twilio webhook.
- **Twilio** — WhatsApp **sandbox** (all Twilio I/O lives in the agent service, not Next.js)
- **PWA** — web manifest + service worker (installable, notification-capable)

### Design system — reskin the Total Jobs system for catering
Grounded in the real tokens from `Novosapien/total-jobs-site` (`assets/css/styles.css`). Keep the TJ family, shift toward hospitality warmth:
- **Retain:** navy `#000050` as deep ink; **Hanken Grotesk** typeface (400–800); fully-rounded **pill** CTAs; `20px`/`14px` radii; navy-**tinted** soft shadows; pastel diagonal gradients; glassy blurred header; restrained motion (respect `prefers-reduced-motion`).
- **Shift:** promote warm coral `#ff9e8c` / amber `#f5a623` into a **copper/flame + warm-cream** hospitality palette; add a restrained **Dubai gold** luxe accent; use **amber/flame to signal URGENT gigs** (ties to "start-tomorrow hot jobs").
- **Imagery:** replace the site's abstract canvas visuals with **real food/venue photography** (kitchens, plated dishes, event spaces) — stock (e.g. Unsplash) is fine for the prototype.
- **Voice:** hospitality tone — warm, urgent — kept distinct from Total Jobs' corporate voice ("no voice bleed").
- Map all of the above into a single **MUI theme** (palette, typography, shape, components overrides).

### Data contract (real source — we design the Supabase schema)
Core tables (field names illustrative; implementing agent finalizes types/indexes):
- `profiles` — `id, role ('candidate'|'recruiter'), name, phone, email, avatar_url, created_at`
- `candidate_profiles` — `profile_id, headline, specialisms[], cuisines[], interests[], open_to_urgent (bool), available (bool), available_from, location_area (text, e.g. 'Palm Jumeirah'), radius_km, right_to_work, cv_url, certifications[]`
  - `interests[]` holds free role/cuisine interests (e.g. "pastry"); `open_to_urgent` is the explicit willingness-for-urgent-temp flag that the matcher requires for `is_urgent` gigs. WE3's "urgent temp" maps to `open_to_urgent=true`; "pastry" maps to `interests[]`/`specialisms[]`.
- `businesses` — `id, name, type ('hotel'|'eventing'|'recruiter'), logo_url, owner_profile_id`
- `packages` — `id, name, price_aed, job_credits, cv_view_credits, features[]`
- `purchases` — `id, business_id, package_id, created_at` (mock checkout)
- `jobs` — `id, business_id, title, role_type, description, venue, location_area (text, e.g. 'Palm Jumeirah'), pay_aed, pay_unit ('shift'|'hour'|'day'), start_at, dress_code (text, nullable), is_urgent, is_temp, status ('open'|'filled'|'closed'), created_at`
  - `location_area` matches the candidate's `location_area` for area-based matching (R9); `dress_code` and the `status` enum back the agent's gig Q&A and "just filled" handling.
- `applications` — `id, job_id, candidate_profile_id, status ('applied'|'accepted'|'declined'), source ('app'|'whatsapp'), created_at, updated_at` — **UNIQUE `(job_id, candidate_profile_id)`**. Accept/decline is an upsert on that conflict target (updates `status`+`source`+`updated_at`), so a WhatsApp accept updates any prior `applied`/`app` row rather than duplicating.
- `notifications` — `id, profile_id, type, payload jsonb, read, created_at`
- `whatsapp_threads` — `thread_key (pk, = '{candidate_profile_id}:{job_id}'), phone (E.164), candidate_profile_id, job_id, status ('active'|'closed'), last_activity_at` — exactly one `active` thread per `phone` (newest notification wins); used by the agent service to route inbound WhatsApp deterministically.
- `whatsapp_messages` — `id, thread_key, direction ('in'|'out'), body, created_at` (agent conversation log; the outbound `/notify` invitation is logged as the first `out` row)

**Default package tiers (seed — veto in review):** `Starter` AED 499 (3 job posts, 10 CV views), `Caterer Pro` AED 1,499 (15 posts, 100 CV views, urgent boosts), `Enterprise` AED 3,999 (unlimited posts, unlimited CV views).

### WhatsApp agent flow (real integration)
```
Recruiter publishes URGENT gig (Next.js)
      → matching.ts selects available candidates (open_to_urgent + interests + area)
      → Next.js POST {gig, candidates[]} → AGENT SERVICE /notify   (shared secret)
                                              → agent service sends Twilio WhatsApp
Candidate replies on WhatsApp
      → Twilio webhook → AGENT SERVICE POST /webhook/whatsapp   (NOT Next.js)
      → LangGraph agent (Claude Sonnet 5; context: gig + candidate + thread from Supabase)
        answers Q&A / handles accept-decline
      → on accept: agent service writes applications row (status=accepted, source=whatsapp)
      → Twilio reply confirms
Recruiter dashboard (Next.js) reflects the acceptance (Supabase Realtime or poll)
```
**The agent is a separate FastAPI + LangGraph service** — full spec in [`agent-spec/`](agent-spec/manifest.yaml) (system prompt, tools `get_gig_details`/`accept_gig`/`decline_gig`, conversation policy, off-topic fallback, Twilio run-book). The Next.js side owns only `matching.ts` and the `/notify` call, and reads the resulting `applications` rows.

### RLS / security note
This is a seeded prototype: keep Supabase RLS permissive/simple to avoid demo friction, but never expose service-role keys to the browser — server actions / route handlers only. No production hardening.

## Reference Files

**From Discovery:**
- `specs/2026-07-01-caterer-dubai-prototype/discovery.md` — full discovery
- `Novosapien/total-jobs-site` → `assets/css/styles.css` (`:root` tokens), `pitch/pitch.css`, `assets/img/*.svg` — real brand tokens + logos
- `Novosapien/total-jobs-vault` → `vision.md`, `index.md`, `domains/job-seeker/job-seeker-experience/job-seeker-experience.md`, `domains/the-engine/commercial-engine/commercial-engine.md`, `drafts/site-pages/marketingos.md` — positioning, voice, pricing curve
- `https://www.caterer.com/` — current site (scope reference only)

**From Spec Research:**
- (none beyond discovery — research was completed during discovery)

## Execution Plan

### Work Streams

| Stream | Responsibility | Owns | Skills |
|--------|---------------|------|--------|
| infra | Scaffold, DB schema + seed, MUI theme, shared UI, PWA, deploy | `caterer-dubai/` config, `supabase/`, `src/theme/`, `src/components/shared/`, PWA/manifest, `vercel` config | ui-ux-pro-max, mobile-pwa-migration |
| candidate | Candidate PWA: feed, detail, inline apply, profile, notifications | `src/app/(candidate)/`, `src/components/candidate/` | ui-ux-pro-max, mobile-pwa-migration |
| recruiter | Recruiter portal: auth, dashboard, packages/checkout, posting, applicants | `src/app/(recruiter)/`, `src/components/recruiter/` | ui-ux-pro-max |
| agent | Matching (in Next.js) + the `/notify` client call to the agent service. The agent service itself (FastAPI+LangGraph) is a **separate deliverable** built from `agent-spec/`. | `src/lib/matching.ts`, `src/lib/agentClient.ts` (Next.js side) · **agent service** → see `agent-spec/manifest.yaml` | claude-api, agent-spec-builder, agent-implementation-builder |

### Phase 1: Foundation (parallel — infra stream)

| Chunk | Stream | Outcome | Depends On |
|-------|--------|---------|------------|
| C1 Scaffold + tooling + PWA + Supabase clients | infra | App runs locally; PWA installable shell; env wired | — |
| C2 DB schema + seed data | infra | All tables exist; ~20 gigs, ~15 candidates, packages, demo accounts seeded | — |
| C3 Catering MUI theme + shared UI + imagery | infra | Themed layout, nav, cards, buttons; catering palette + photography | — |

**Details:**

- [ ] **C1 Scaffold + tooling + PWA + Supabase clients**

  Outcome: Next.js (App Router, TS) app in `caterer-dubai/` runs locally, is installable as a PWA, and has Supabase server/browser clients + env var scaffolding.
  Stream: infra
  Skills: ui-ux-pro-max, mobile-pwa-migration

  - Scaffold Next.js + TypeScript + MUI in `caterer-dubai/`
  - Add PWA support (manifest, service worker, installability, icons)
  - Set up Supabase server + browser clients; document required env vars (Supabase, Twilio, Anthropic)
  - Establish mobile-first layout conventions

- [ ] **C2 Database schema + seed data**

  Outcome: Supabase schema created (migrations) matching the Architecture data contract, seeded with realistic Dubai data.
  Stream: infra
  Skills: (none framework-specific)

  - Create tables per the data contract; keep RLS permissive for prototype
  - Seed ~20 Dubai gigs across real venues (Atlantis, Burj Al Arab, Address Downtown, DIFC eventing, etc.), mix of urgent/temp
  - Seed ~15 candidate profiles/CVs, package tiers, demo chef + demo recruiter accounts, one designated "hero" available chef
  - AED currency, Dubai locations throughout

- [ ] **C3 Catering MUI theme + shared UI + imagery**

  Outcome: A single MUI theme reskinning the TJ system for catering, plus shared components (nav, gig card, buttons, urgent badge) and imagery approach.
  Stream: infra
  Skills: ui-ux-pro-max

  - Build MUI theme from reskinned TJ tokens (see Architecture): palette, Hanken Grotesk, pill buttons, radii, shadows, gradients
  - Amber/flame **URGENT** treatment for hot gigs
  - Shared components: app shell/nav, gig card, section headers, buttons, empty states
  - Wire real food/venue photography (stock)
  - **Derive a Caterer brandmark/wordmark + PWA icon** from the TJ glyph system if no brand kit is provided — do **not** ship the Total Jobs logo (Q3/discovery R6)

### Phase 2: Features (parallel, blocked by Phase 1)

| Chunk | Stream | Outcome | Depends On |
|-------|--------|---------|------------|
| C4 Candidate feed + search + gig detail | candidate | Anonymous browse/search/detail works | Phase 1 |
| C5 Progressive auth + apply flow | candidate | Inline phone-first apply + OTP creates account | Phase 1 + C2 |
| C6 Candidate profile + notifications | candidate | Availability toggle, interests, notifications inbox | Phase 1 + C2 |
| C7 Recruiter auth + dashboard | recruiter | Recruiter logs in, sees dashboard | Phase 1 |
| C8 Packages + mock checkout + posting | recruiter | Buy package (mock) gates posting; post urgent/temp gigs | Phase 1 + C7 |
| C9 Applicants + candidate CV view | recruiter | Recruiter sees applicants + opens CVs | Phase 1 + C2 |
| C10 Matching function + notifications wiring | agent | Rules-based matching feeds in-app + WhatsApp | Phase 1 + C2 |
| C11 WhatsApp Claude agent (requires agent-spec-builder) | agent | Real WhatsApp conversational accept loop | Phase 1 + C2 + C10 |

**Details:**

- [ ] **C4 Candidate feed + search + gig detail**

  Outcome: Anonymous users browse and search all gigs and view full gig detail, no login required. (R1)
  Stream: candidate · Skills: ui-ux-pro-max, mobile-pwa-migration

  - Gig feed (mobile-first cards, urgent gigs highlighted) + search/filter
  - Full gig detail page (venue, AED pay, start time, description)
  - Essential empty state for no results (EC7)

- [ ] **C5 Progressive auth + apply flow**

  Outcome: Tapping Apply expands an inline phone-first panel (no takeover); phone OTP creates the account and opts into WhatsApp; application recorded. (R2)
  Stream: candidate · Skills: ui-ux-pro-max
  Depends On: Phase 1 + C2

  - Inline, collapsible apply panel under the gig (name + mobile only)
  - Supabase phone OTP; silent account creation; WhatsApp opt-in via captured number
  - Record application; handle wrong-OTP (EC1) and collapse-without-submit (EC2)

- [ ] **C6 Candidate profile + notifications**

  Outcome: Candidate sets availability + interests (progressive tiers) and has a notifications inbox. (R3)
  Stream: candidate · Skills: ui-ux-pro-max
  Depends On: Phase 1 + C2

  - Availability toggle + role interests/specialisms (Tier 2 enrichment fields)
  - Tier 3 CV/cert prompts (surfaced on recruiter interest)
  - Notifications inbox (in-app mirror of WhatsApp/alerts)

- [ ] **C7 Recruiter auth + dashboard**

  Outcome: Recruiter logs in upfront and lands on a portal dashboard. (R4, R13)
  Stream: recruiter · Skills: ui-ux-pro-max

  - Email/password auth + 1-tap demo persona login
  - Dashboard shell: posted gigs, applicant counts, quick actions

- [ ] **C8 Packages + mock checkout + posting**

  Outcome: Recruiter buys a package via mock checkout that gates posting; can post gigs incl. urgent temp. (R5, R6)
  Stream: recruiter · Skills: ui-ux-pro-max
  Depends On: Phase 1 + C7

  - Package tiers UI + mock checkout (grants credits, no real payment)
  - Post-gig form incl. **is_urgent / is_temp**; credit gating + upsell when exhausted (EC5)

- [ ] **C9 Applicants + candidate CV view**

  Outcome: Recruiter views a gig's applicants and opens candidate CVs/profiles. (R7)
  Stream: recruiter · Skills: ui-ux-pro-max
  Depends On: Phase 1 + C2

  - Applicants list per gig (incl. WhatsApp-sourced acceptances)
  - Candidate CV/profile view

- [ ] **C10 Matching function + notifications wiring**

  Outcome: Rules-based matching selects available candidates for a gig and drives in-app + WhatsApp notifications. (R9)
  Stream: agent · Skills: (none framework-specific)
  Depends On: Phase 1 + C2

  - `matching.ts`: filter by `open_to_urgent` + interests/specialisms + `location_area` (string match, no geocoding — see R9)
  - On urgent-gig publish, produce match set; write in-app notifications; **`POST {gig, candidates[]}` to the agent service `/notify`** (via `agentClient.ts`, shared secret)
  - Zero-match handling (EC4)

- [x] **C11 WhatsApp agent — SEPARATE service** *(spec complete → [`agent-spec/`](agent-spec/manifest.yaml))*

  Outcome: A FastAPI + LangGraph service (Claude Sonnet 5) that, on `/notify`, sends a real WhatsApp message to matched candidates, and on inbound `/webhook/whatsapp` converses and records accept/decline, reflected on the dashboard. (R8, R15)
  Stream: agent · Skills: agent-implementation-builder, agent-impl-teammate-spawn, individual-agents, prompt-engineering, tools-and-utilities, cloudrun-deploy
  Depends On: Phase 1 + C2 + C10
  Note: **The agent design is fully specified in `agent-spec/`** (system prompt, tools `get_gig_details`/`accept_gig`/`decline_gig`, conversation/accept policy, off-topic fallback EC6, Twilio wiring, run-book for join + 24h window EC3). **Build it via `agent-implementation-builder` pointed at `agent-spec/manifest.yaml`** — it is a distinct Python service from the Next.js app.
  **Agent v1 scope boundary (Q2):** gig Q&A (pay/venue/time/dress code) + accept/decline only. **Deferred:** "show me other gigs", browsing, and changing availability over WhatsApp.

  - Build the agent service per `agent-spec/` (FastAPI wrapper, LangGraph agent, tools)
  - `/notify` (outbound send on urgent-gig publish) + `/webhook/whatsapp` (inbound → agent → reply)
  - Accept → write `applications` (status=accepted, source=whatsapp); confirm on WhatsApp
  - Graceful off-topic fallback; blocked-send handling → "notification pending"; Cloud Run min-instances=1

### Phase 3: Integration & polish (blocked by Phase 2)

| Chunk | Stream | Outcome | Depends On |
|-------|--------|---------|------------|
| C12 End-to-end demo wiring + hero scenario | infra | Full walkthrough runs; hero scenario seeded; dashboard reflects WhatsApp accept | Phase 2 |
| C13 Deploy to Vercel + QA pass | infra | Live on Vercel; PWA installs; demo QA + run-book verified | Phase 2 |

**Details:**

- [ ] **C12 End-to-end demo wiring + hero scenario**

  Outcome: The full pitch walkthrough runs coherently; the WhatsApp accept reflects on the recruiter dashboard in near-real-time; 1-tap personas seeded.
  Stream: infra · Skills: ui-ux-pro-max
  Depends On: Phase 2

  - Wire real-time (Supabase Realtime or poll) so acceptances appear on the dashboard
  - Seed and script the hero scenario (urgent Atlantis gig → hero chef phone)
  - Verify the demo walkthrough steps 1–5 end-to-end

- [ ] **C13 Deploy to Vercel + QA pass**

  Outcome: Deployed, installable, QA'd; WhatsApp run-book validated.
  Stream: infra · Skills: mobile-pwa-migration
  Depends On: Phase 2

  - Deploy to Vercel with env vars; verify PWA install on mobile
  - Demo QA pass (mobile viewport polish, happy-path rails)
  - Validate Twilio run-book (sandbox join + 24h window) for demo day

### Communication

| From | To | When | What |
|------|----|------|------|
| infra | all | After Phase 1 | Schema + types, theme tokens, shared component API, env var names |
| candidate | agent | During Phase 2 | Application data shape + accept path (so WhatsApp accept writes the same shape) |
| recruiter | agent | During Phase 2 | Urgent-gig publish event contract (trigger for matching + outbound) |
| agent | recruiter | During Phase 2 | How WhatsApp-sourced acceptances appear in applicants/dashboard |

## Acceptance Criteria

- [ ] Anonymous user can browse/search ≥20 gigs and open full detail with no login (visit `/jobs`)
- [ ] Tapping Apply opens an **inline** phone-first panel (no modal/takeover); correct OTP creates account + WhatsApp opt-in
- [ ] Candidate can toggle availability and set role interests; state persists
- [ ] Recruiter logs in (incl. 1-tap persona), buys a package via mock checkout, and posts a standard **and** an urgent temp gig
- [ ] Publishing an urgent gig sends a **real WhatsApp message** to a matched candidate's phone
- [ ] Replying "I'm in" on WhatsApp records an acceptance and it appears on the recruiter dashboard
- [ ] Recruiter can view a gig's applicants and open a candidate CV/profile
- [ ] App is an installable, mobile-first PWA using the catering MUI theme
- [ ] Deployed and reachable on Vercel; Supabase backs auth + data
- [ ] Seed data present: ~20 gigs, ~15 candidates, package tiers, demo accounts (AED, Dubai)
- [ ] WhatsApp run-book documented (sandbox join + 24h window) with graceful blocked-send handling
- [ ] `npm run build` succeeds; `npm run lint` clean; `tsc --noEmit` clean

## Completion Promise

<promise>CATERER_DUBAI_PROTOTYPE_COMPLETE</promise>

## Notes

- **Fidelity discipline:** happy-path rails, seeded data everywhere except the one real WhatsApp integration. Do not build CRUD depth, admin, or unhappy paths beyond the listed edge cases.
- **The demo IS the product.** Every decision serves the walkthrough (discovery §Solution Overview) and the WhatsApp hero moment.
- **Defaults chosen (open for veto):** package tiers/prices; seed venues; three-tier progressive profiling; hero scenario = urgent Atlantis gig → designated available chef. See discovery Open Questions Q1–Q6.
- **Dependencies to collect before/at build:** Supabase project + keys, Twilio credentials + sandbox number, Anthropic API key, Total Jobs brand kit (fallback = grounded `total-jobs-site` tokens).
- **Known risks** (discovery §9): Twilio sandbox join (R1) + 24h window (R2) can silently break the live hero — mitigated by run-book (C13) and blocked-send handling (C11).
- **Deferred (post-prototype, acknowledged from discovery NICE list):** real Stripe test-mode checkout (mock is v1); availability *calendar* (toggle is v1); CV upload/parse (CVs are **seeded**; `cv_url` points to seeded assets); device-local shortlist on the anonymous tier; web push alongside WhatsApp.
- **Review:** `reviews/review-001.md` — Overall WARN (0 blocking). This spec incorporates the consequential fixes (matching predicate + `open_to_urgent`/`interests[]` schema, "login as chef" semantics, Tier-3 trigger, agent v1 scope, Caterer brandmark, screen-record fallback). LOW findings (#5–#8) left to implementer defaults.
