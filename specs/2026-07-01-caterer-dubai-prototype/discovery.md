# Discovery — Caterer.com Dubai · Reimagined (Pitch Prototype)

> **Date:** 2026-07-01
> **Origin:** Direct ideation session (discovery skill)
> **Status:** Discovery complete → ready for spec
> **One-liner:** A high-fidelity, clickable pitch prototype of a reimagined **Caterer.com (Dubai)** — a mobile-first PWA marketplace for the catering world — whose star is a **real, Claude-powered WhatsApp agent** that pings available chefs about urgent temp gigs and closes the loop conversationally.

---

## 1. Problem Statement

**Who:** Total Jobs (The Stepstone Group) owns **Caterer.com**, a catering job board. Caterer is the "sister brand" to Total Jobs — hospitality-focused, urgency-first. The global site exists; the **Dubai** market is the focus for this work.

**The problem with the status quo (today's Caterer.com):**
- **Mobile experience is poor.** The site was built desktop-first; chefs, waiters and catering crew are *on the go* and live on their phones. The current mobile site is not optimised for them.
- **The design is old-fashioned** and doesn't feel like the modern, premium Total Jobs family.
- **Branding is misaligned** with Total Jobs' current identity.
- The experience doesn't serve the **reality of catering work**: most roles are **contract / temp / urgent** ("3 chefs needed tonight"), and the current product isn't built around that urgency or around reaching *available* candidates fast.

**Why it matters now:** This is a **pitch prototype for Total Jobs**. The goal is to show Total Jobs a working, end-to-end vision of what a reimagined Caterer Dubai could be — proving out (in a tangible, clickable, partly-real product) the direction their *own* strategy vault already describes: a mobile/app/**WhatsApp**-native, agent-assisted, urgency-first hospitality marketplace.

**What success looks like:** Total Jobs stakeholders walk through the whole app — both sides of the marketplace — and experience a genuine "wow" moment when a **real WhatsApp message** from the agent lands on a phone during the demo. The prototype makes the abstract vision concrete and sells the engagement.

---

## 2. Input / Output Contract

The prototype is experienced as a **guided walkthrough** of a two-sided marketplace, plus one genuinely-real integration. Two contracts matter:

### 2a. Product walkthrough (what the demo must let you do)

```
CANDIDATE (chef) side — NO login required to explore or apply-initiate
  IN:  open PWA (anonymous) → browse/search Dubai gigs → open a gig
  OUT: full gig detail; inline "Apply in 20 seconds" (phone-only) at point of apply
  IN:  set availability ON + role interests (works anonymously, saved on device)
  OUT: application recorded; opted into WhatsApp alerts via captured number

RECRUITER / BUSINESS side — login upfront
  IN:  log in → buy a job package (mock checkout) → post a gig (standard or URGENT temp)
  OUT: gig live; dashboard of posted gigs, applicants, candidate CVs
```

### 2b. WhatsApp agent contract (the one REAL integration)

```
TRIGGER   recruiter publishes an URGENT temp gig
MATCH     system selects seeded candidates whose availability + interests + location fit
SEND      each matched candidate's WhatsApp receives a proactive message:
            gig summary (role, venue, AED pay, start time) + prompt to reply
INPUT     candidate's freeform WhatsApp replies:
            "what's the pay?" · "where is it?" · "dress code?" · "I'm in" · "not tonight"
BRAIN     Claude agent, given the gig details + candidate profile as context:
            answers questions, handles accept/decline, updates availability
OUTPUT    (a) conversational replies on WhatsApp (hospitality voice)
          (b) state change in Supabase → recruiter dashboard reflects the
              acceptance / application in near-real-time
```

---

## 3. Solution Overview

A **mobile-first PWA** (installable, feels premium) reskinning the Total Jobs design system for the catering world, with simulated data everywhere **except** the WhatsApp agent, which is genuinely live.

```
                    CATERER · DUBAI (reimagined) — PWA on Vercel
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                            ▼
   CANDIDATES (chefs, waiters, crew)          BUSINESSES (hotels, eventing cos, recruiters)
   progressive auth — browse freely           login upfront
   apply inline (phone only)                  buy package (mock) → post gigs
   availability + interests                   dashboard: gigs · applicants · CVs
        │                                            │
        └──────────────┬──────────────┬─────────────┘
                       ▼              ▼
                  MATCHING       ★ WhatsApp AGENT (REAL — Twilio sandbox + Claude)
              (rules + seeded)   proactive urgent-gig ping → conversational accept
                       │
        Supabase (auth · DB · seeded CVs/gigs/users) · Next.js · MUI (reskinned TJ system)
```

### The demo walkthrough it must support (the pitch script)

```
1. Land on the branded PWA — premium, catering imagery, feels like Total Jobs' family
2. "Login as a chef" (or just browse anonymously):
     browse Dubai gigs → open one → tap Apply → inline "Apply in 20 sec" (name + mobile)
     → profile: flip availability ON, pick role interests (e.g. "urgent temp, pastry")
3. "Login as a recruiter":
     dashboard → buy a job package (mock checkout)
     → post an URGENT temp gig ("3 chefs needed tonight — Atlantis The Palm")
4. ★ THE MOMENT: the seeded available chef's phone gets a REAL WhatsApp message →
     chats with the AI agent (asks pay/venue, says "I'm in") → acceptance recorded
5. Back to recruiter: dashboard shows the chef as applied/accepted → view their CV
```

### Progressive / just-in-time authentication (candidate side)

The "login wall" is **never a wall** — it's an inline panel under the gig, and it asks for the least possible thing (a phone number), which is *also* what wires the chef into WhatsApp.

```
TIER 0 · Anonymous — full run of the app
  browse & search all gigs · full gig detail · shortlist (device-local) · set availability/interests locally
        │  taps "Apply"  ← the ONLY natural friction point
        ▼
TIER 1 · Lightweight identity  (inline, NOT a modal/takeover; collapsible; keep browsing)
  ┌──────────── gig summary ────────────┐
  │  Apply in 20 seconds                 │
  │  Name [____]  Mobile [+971 ______]  │  → phone OTP (WhatsApp/SMS), no password.
  │  "We'll text you a code."  [Apply →] │    Account created silently + opted into WhatsApp.
  └──────────────────────────────────────┘
        │  reaches for MORE value (urgent-gig alerts / better matches)
        ▼
TIER 2 · Enrichment (each field unlocks a stated benefit)
  specialisms/cuisine · availability calendar · location + radius · right-to-work
        │  a recruiter shortlists them / requests an interview
        ▼
TIER 3 · Full profile (only when clearly worth it)
  CV upload · certifications (food hygiene) · references · photo

RECRUITER / BUSINESS — logs in upfront (posting & paying). Standard.
```

**Why phone-first:** one capture (the mobile number) does double duty — it completes the application *and* subscribes the chef to the WhatsApp channel, so the hero loop "just works" for anyone who has applied. This is also a headline "why this beats today's Caterer.com" point for the pitch.

---

## 4. Key Decisions (with rationale)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Purpose = client pitch prototype** (not internal POC, not real launch) | Sets the fidelity bar: impressive & clickable beats production-hardened. |
| D2 | **Simulated data everywhere, ONE real integration (WhatsApp)** | A single genuinely-real hero makes the whole simulated marketplace feel alive; maximises wow-per-effort. |
| D3 | **WhatsApp = conversational Claude agent, real, via Twilio sandbox** | Twilio sandbox is instant (no Meta business-verification delay); real messages on a real phone are the demo's climax. Chosen over an in-app simulated chat. |
| D4 | **Progressive/just-in-time auth for candidates; upfront login for recruiters** | Forcing early signup deters on-the-go chefs; recruiters expect to log in because they transact. Phone-first Tier-1 doubles as WhatsApp opt-in. |
| D5 | **Stack: Next.js on Vercel · Supabase (auth+DB) · MUI · Claude · Twilio** | Forced/natural given stated requirements (Vercel, Supabase, Material UI). Next.js is the native fit. Claude = Novosapien's agent brain. |
| D6 | **Reskin the Total Jobs design system for catering** (there is no separate Caterer palette) | Stay in the TJ family (navy/teal/coral, Hanken Grotesk, pill buttons, soft gradients, 20px radii) but shift toward warm hospitality tones + real food/venue photography. |
| D7 | **E-commerce = mock checkout** (no real payment) for v1; real Stripe test mode is a nice-to-have | Payments don't need to be real to demo the "buy a package to unlock posting" flow. |
| D8 | **Happy-path rails, not a real system** | Nobody clicks unhappy paths in a pitch; polish the demoed flows, stub the rest. |
| D9 | **Urgency-first, hospitality voice** (from TJ's own vault) | Total Jobs' strategy defines Caterer as "same core, reskinned, urgency-first — 'start tomorrow' hot jobs" with a strict hospitality voice ("no voice bleed"). We demonstrate their own vision. |
| D10 | **Matching = rules + seeded lists** (not ML) | For a demo, deterministic rule-based matching on availability + interests + location is enough and controllable on stage. |

---

## 5. Constraints (hard)

- **C1 — Timeline:** Target **Friday (2026-07-03)**; may bleed into the following week if needed (not a guillotine). Scope kept full but sequenced so the walkthrough is demoable first.
- **C2 — Stack:** Must use **Supabase** (DB + auth) and deploy on **Vercel**; UI must be **Google Material UI (MUI)**; design must sit within the **Total Jobs brand family** (reskinned for catering).
- **C3 — WhatsApp must be genuinely real** (Twilio sandbox), not simulated.
- **C4 — Mobile-first PWA** (installable, notification-capable), because the primary user is a chef on the go.
- **C5 — Dubai context:** AED currency, real Dubai venues/locations, hospitality tone.

---

## 6. Scope

### In scope (MUST — the walkthrough rails, polished, happy-path only)
- Branded mobile-first PWA shell (MUI theme on reskinned TJ palette, catering imagery, installable, premium feel)
- Auth: **1-tap demo personas** (pre-seeded chef + recruiter) with real Supabase email/password available; candidate progressive/phone-first auth flow
- **Candidate:** gig feed → gig detail → inline apply → confirmation; profile with availability toggle + role interests; notifications inbox
- **Recruiter:** dashboard → post gig (standard + URGENT temp) → applicants list → view candidate CV; buy package (**mock** checkout)
- **★ WhatsApp hero:** urgent gig → matched available chefs get a **real** WhatsApp message → conversational Claude agent → accept → reflected on recruiter dashboard
- Pre-seeded gorgeous data: ~20 Dubai gigs across real venues (Atlantis, Burj Al Arab, DIFC eventing, etc.), ~15 chef/waiter/crew CVs, AED, Dubai locations

### Deferred (NICE — only if time allows)
- Web push notifications alongside WhatsApp
- Real Stripe **test-mode** checkout (replacing mock)
- Gig feed search/filter depth · candidate CV upload/parse
- Availability calendar (vs simple toggle)

### Explicitly OUT of scope (this is how we protect the timeline)
- Real payment processing / payouts / invoicing
- Real Meta WhatsApp Business API (we use the Twilio **sandbox**)
- Real matching ML / recommendation engine (rules + seeded lists instead)
- Admin / moderation / analytics dashboards
- i18n / multi-language / multi-region (Dubai only)
- Password reset, account settings depth, email flows, recruiter KYC/onboarding
- Real in-app messaging inbox beyond the WhatsApp thread
- Real signup funnel for recruiters (demo accounts suffice)
- Non-happy-path error states, empty states beyond the essentials

---

## 7. Context

### Product & positioning (from `total-jobs-vault`)
- Total Jobs (The Stepstone Group, CEO contact Luke McKend) is a UK job board; **Caterer is its hospitality sister brand**. Prior pitch milestone was ~19 June; this is the build/prototype phase.
- **Caterer brand definition:** "same core, reskinned, with urgency-first presentation — 'start tomorrow' hot jobs," a distinct **hospitality voice** kept strictly separate from Total Jobs' corporate/horizontal voice ("no voice bleed").
- Total Jobs' own vision is **agent-native and multi-channel** (web, app, MCP, **WhatsApp**, voice), with job seekers getting a persistent "career advisor" agent and recruiters getting posting/screening/candidate-recommender agents. **Our WhatsApp agent is a concrete slice of their own stated vision** — strong pitch framing.
- Commercial model reference: a "Caterer premium" pricing curve exists in the vault's `commercial-engine.md` (informs package pricing tiers for the mock e-commerce).

### Brand system (from `total-jobs-site` — the real design tokens)
- **Palette:** `--navy #000050` (primary ink), `--blue #0c2577` (official TJ blue), `--teal #005966` (CTAs/accent), `--coral #ff9e8c` + `--amber #f5a623` (warm accents). No separate Caterer palette exists — Caterer is a reskin.
- **Typography:** **Hanken Grotesk** (400–800; a stand-in for the real TJ face "Relative Pro"), fluid `clamp()` scale, tight heading letter-spacing.
- **System:** pill (999px) teal CTAs, `20px` / `14px` radii, navy-**tinted** soft shadows, pastel diagonal gradient hero (`--grad`: mint→greige→rose), glassy blurred sticky header, restrained motion (respects `prefers-reduced-motion`).
- **Logos:** `assets/img/totaljobs-logo.svg`, `totaljobs-light-logo.svg`, `favicon.svg` (gradient rounded-square glyph + navy mark). **No Caterer logo exists** — will need a Caterer treatment.
- **Reskin direction (proposed):** keep TJ navy as deep ink; promote warm coral/amber into a **copper/flame + warm-cream** hospitality palette; add a restrained **Dubai gold** luxe accent; use **amber/flame to signal "urgent" gigs** (ties to "start-tomorrow hot jobs"); replace the site's abstract animated canvas visuals with **real food/venue photography**. Carry over Hanken Grotesk, pill buttons, gradients, 20px radii → maps cleanly to an MUI theme.

### Integrations & dependencies
- **Supabase** — auth (email/password + phone OTP), Postgres DB, seeded data. *(Needs a project + keys.)*
- **Twilio WhatsApp sandbox** — user **has a Twilio account**; needs credentials + sandbox number wired in.
- **Claude** — agent brain (Anthropic API key).
- **Vercel** — hosting/deploy.
- **Brand kit** — user will provide the official Total Jobs brand kit; `total-jobs-site` tokens above serve as grounded fallback / cross-check.

---

## 8. Reference Files

Consulted during discovery:

**External repos (cloned to scratchpad during discovery):**
- `Novosapien/total-jobs-vault` — product strategy/discovery vault. Key files:
  - `vision.md` — agent-native, multi-channel (incl. WhatsApp) product vision
  - `index.md` — engagement overview (Caterer = Total Jobs' hospitality sister brand)
  - `domains/job-seeker/job-seeker-experience/job-seeker-experience.md` — Caterer "urgency-first, start-tomorrow" positioning + hospitality voice
  - `domains/the-engine/commercial-engine/commercial-engine.md` — "Caterer premium" pricing curve
  - `drafts/site-pages/marketingos.md` — "no voice bleed" dual-brand voice rule
  - `drafts/site-pages/visual-notes.md` — animation/aesthetic direction
  - `drafts/competitor-research/` — LinkedIn, Indeed, CV-Library, HeyJobs, Vagas, Jack-and-Jill (market context)
- `Novosapien/total-jobs-site` — pitch site; **source of the real brand tokens**. Key files:
  - `assets/css/styles.css` (`:root`, lines 8–46) — colour/type/spacing/radius/shadow tokens
  - `pitch/pitch.css` — deck/slide archetypes
  - `assets/img/totaljobs-logo.svg`, `totaljobs-light-logo.svg`, `favicon.svg` — logos/favicon

**External reference (context only, per user):**
- `https://www.caterer.com/` — the current site being reimagined (scope reference; not a design reference). *Note: timed out on automated fetch during discovery — not inspected in detail.*

---

## 9. Known-Risks (pre-mortem)

| Risk | Impact | Mitigation |
|------|--------|------------|
| **R1 — Twilio sandbox "join" requirement** | The demo chef's phone must send `join <code>` to the sandbox once before it can receive messages. If skipped, the hero moment silently fails. | Pre-join the demo phone(s) as a scripted pre-demo step; document it in a run-book. |
| **R2 — WhatsApp 24-hour session window** | Twilio sandbox freeform outbound only works within 24h of the recipient's last inbound message. A proactive "urgent gig" ping outside the window is blocked. | Have the demo chef message the sandbox shortly before the pitch (or the recruiter action triggers within window); optionally pre-approve a template. Bake into run-book. |
| **R3 — Live-demo dependency on real messaging** | Network/API hiccups during a live pitch. | Have a scripted fallback (screen-recorded clip of the WhatsApp exchange) as insurance; keep the chef phone on stable connectivity. |
| **R4 — Brand kit not delivered in time** | Reskin blocked on assets. | Grounded fallback: `total-jobs-site` tokens (documented above) let us proceed without waiting. |
| **R5 — Scope creep from "show them everything"** | Full two-sided app is broad; polishing every screen risks the timeline. | Rails-not-systems discipline; seed data instead of building CRUD depth; NICE/OUT lists enforced. |
| **R6 — No Caterer logo exists** | Need a Caterer brandmark for the header/PWA icon. | Derive a Caterer treatment from the TJ glyph system, or request from user with brand kit. |
| **R7 — Agent goes off-script on stage** | A stakeholder asks the WhatsApp agent something odd. | Constrain the agent's system prompt to the gig/candidate context with a graceful catering-flavoured fallback; test adversarial questions before demo. |

---

## 10. Open Questions (for spec / build)

- **Q1 — Package tiers:** exact recruiter package definitions for the mock e-commerce (names, prices in AED, what each unlocks — job count / CV views)? Vault's "Caterer premium" curve can seed sensible defaults.
- **Q2 — Agent conversational breadth:** beyond accept/decline + gig Q&A, should the agent also handle "show me other gigs tonight" or availability changes over WhatsApp in v1, or is that Tier-2/deferred?
- **Q3 — Caterer logo/wordmark:** provided in the brand kit, or do we derive one?
- **Q4 — Push notifications:** confirm deferred vs. wanted for the walkthrough (currently NICE-to-have; WhatsApp is the hero).
- **Q5 — Demo personas:** how many seeded chefs/recruiters, and which specific persona is "the available chef" for the hero (whose phone receives WhatsApp)?
- **Q6 — Data realism:** any specific real Dubai venues/recruiters Total Jobs would recognise that we should seed for credibility?

---

## 11. Next Steps

1. **Hand off to a spec-builder.** This is a **hybrid** build (frontend + backend/API + a Claude agent), so route to **`/general-spec-builder`** pointed at this folder; it will produce specs for the app/API/frontend and hand the WhatsApp-agent component to **`/agent-spec-builder`** as needed.
2. Spec should nail: the MUI theme/token mapping (reskin), the Supabase schema + seed data, the progressive-auth flow, the recruiter posting + mock-checkout flow, and the WhatsApp agent (tool contract, system prompt, Twilio wiring, run-book for R1/R2).
3. Resolve Open Questions Q1–Q6 during spec.
4. Collect dependencies: Supabase project + keys, Twilio credentials + sandbox number, Anthropic API key, Total Jobs brand kit.

**Invoke:** `/general-spec-builder` and point it at `specs/2026-07-01-caterer-dubai-prototype/`.
