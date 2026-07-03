# Progress — Caterer.com Dubai · Reimagined (Pitch Prototype)

| Field | Value |
|-------|-------|
| **Spec folder** | `specs/2026-07-01-caterer-dubai-prototype/` |
| **Created** | 2026-07-01 |
| **Idea origin** | Direct ideation session (discovery skill) |
| **Status** | `impl` — BOTH deliverables code-complete. App: build+lint+types green (11 routes). Agent service: 15 files, py_compile clean. Not yet run live (needs Supabase/Twilio/Anthropic creds + deploy). |
| **App location** | `caterer-dubai/` subfolder (team-mode build) |
| **Target date** | Friday 2026-07-03 (soft — may bleed into following week) |
| **Owner** | nova@novosapien.ai |

## Stage log

| Date | Stage | Notes |
|------|-------|-------|
| 2026-07-01 | discovery | `discovery.md` written. Two research agents run against `total-jobs-vault` (product/positioning) and `total-jobs-site` (real brand tokens). Auth model, fidelity, WhatsApp-as-hero, stack, scope all settled. |
| 2026-07-01 | spec | `spec.md` written (hybrid, team mode). Work type = hybrid → agent chunk C11 routed to agent-spec-builder. 15 requirements, 8 worked examples, 7 edge cases, 4 streams, 3 phases, 13 chunks. |
| 2026-07-01 | review | `/review-general-spec` run (3 parallel agents + lead grounding/testability). Overall **WARN, 0 blocking**. `reviews/review-001.md` + `review-001-testseed.md` written. 6 consequential fixes applied to spec (matching predicate + schema, login-as-chef, Tier-3 trigger, agent v1 scope, Caterer brandmark, screen-record fallback). |
| 2026-07-01 | agent-spec | `/agent-spec-builder` for C11. Single LangGraph agent (`message-tool-agent`), Claude Sonnet 5, as a SEPARATE FastAPI+LangGraph service on Cloud Run. `agent-spec/` written (manifest, overview, whatsapp-gig-agent, agent-config). |
| 2026-07-01 | agent-review | `/review-agent-spec` (3 parallel). Structural WARN, Source PASS, Ambiguity **FAIL (3 HIGH)**. `reviews/review-002.md`. Root gap: inbound phone→thread routing + tool-ID injection. **Fixes applied** (spec-defect loopback): `whatsapp_threads` table + one-active-thread-per-phone routing, thread_key format, tool IDs injected (no LLM IDs), concrete `/notify` schema, `X-Notify-Secret`, preloaded-context handoff, idempotent upsert (unique `(job_id,candidate_profile_id)`), retry/timeout, jobs schema (`location_area`/`dress_code`/`status` enum). Framework pinned: `create_react_agent` + Postgres checkpointer; Deep Agents = future career-advisor path. Re-verifying ambiguity. |

## Drift Log

| Date | Source stage | What was wrong/changed | Fix applied |
|------|--------------|------------------------|-------------|
| 2026-07-01 | agent-spec architecture decision | General `spec.md` assumed the WhatsApp agent + Twilio webhook lived in the Next.js app (`/api/whatsapp/webhook`, in-app outbound). User chose a separate FastAPI+LangGraph service. | Reconciled `spec.md`: Stack, WhatsApp flow, agent work-stream, C10 (`/notify` call), and C11 (now a separate service built from `agent-spec/`). Webhook → agent service `/webhook/whatsapp`; all Twilio I/O in the agent service; Next.js owns `matching.ts` + `agentClient.ts` only. |
| 2026-07-01 | agent-spec review (ambiguity FAIL) | `jobs` schema in `spec.md` had `location`/no `dress_code`/unpinned `status`, contradicting the agent's tool reads; thread routing + tool-ID injection undefined. | Fixed both specs: `spec.md` `jobs` → `location_area` + `dress_code` + `status` enum, `applications` unique constraint, added `whatsapp_threads`. Agent spec: thread model, injected IDs, `/notify` schema, framework/packages. |

## Implementation

**Next.js app (`caterer-dubai/`) — BUILT & passing** (`npm run build`, `npm run lint`, TS all green; 11 routes).
- Foundation (lead): Next16+Turbopack+MUI9+Supabase+PWA scaffold; catering theme; schema `0001_schema.sql` + `seed.sql` (18 gigs, 15 candidates incl. hero chef, packages, demo recruiter); libs (types, format, session, supabase clients, queries, matching, agentClient); shared components; landing (1-tap personas).
- Candidate stream (team): feed/search/detail, inline phone-first ApplyPanel (demo OTP), profile (availability/open-to-urgent/interests), alerts inbox.
- Recruiter stream (team): dashboard w/ live Realtime reflection, packages+mock checkout, credit-gated post (urgent→matching→notify agent), applicants + candidate CV (fires Tier-3 alert).
- Build fixes (lead): Turbopack/PWA conflict → manual PWA; MUI v9 icon renames (`*OutlineOutlined`); Server→Client `component={Link}` → `component="a"` in server pages; `setState`-in-effect lint fix.
- Demo fidelity notes + Twilio run-book in `caterer-dubai/README.md`.

**Agent service (`caterer-agent/`) — BUILT** (single-agent mode; py_compile clean on all 11 .py).
- FastAPI: `GET /health`, `POST /notify` (X-Notify-Secret, constant-time), `POST /webhook/whatsapp` (Twilio inbound).
- LangGraph `create_react_agent` + `langgraph-checkpoint-postgres` keyed by `thread_id=thread_key`; tools `get_gig_details`/`accept_gig`/`decline_gig` with ids injected via closure (no LLM ids); idempotent upsert on `(job_id,candidate_profile_id)`, source='whatsapp'.
- Thread routing: one active `whatsapp_threads` row per phone (newest-wins); message logging; blocked-send → 'pending'.
- `/notify` contract + DB columns cross-checked against `agentClient.ts` + `0001_schema.sql`. `requirements.txt`, `.env.example`, `Dockerfile` (py3.11), `README` w/ Twilio run-book.
- NOT runtime-verified (sandbox py3.9, no creds/stack) — verify on Cloud Run deploy. One flagged item: supabase-py embedded-relation shape handled defensively, worth a first-live-run check.

### Remaining (needs user's cloud accounts — cannot be done autonomously)
- Provision Supabase (run schema+seed), Anthropic key, Twilio sandbox; set env on both apps.
- Deploy app → Vercel; agent service → Cloud Run (min-instances=1); wire `AGENT_SERVICE_URL` + `NOTIFY_SHARED_SECRET`.
- First end-to-end live verification + Twilio sandbox join/24h run-book.

## Original next-stage plan
- **Implementation.** Two deliverables:
  1. **Next.js app** (`caterer-dubai/`) → `/general-implementation-builder` on `spec.md` (team mode).
  2. **Agent service** (Python FastAPI+LangGraph) → `/agent-implementation-builder` on `agent-spec/manifest.yaml`.
- Build the agent service alongside/after the Next.js `applications` schema + `/notify` client exist (C10). Collect creds first: Supabase, Twilio (have), Anthropic, Cloud Run/GCP, brand kit.

## Escalation & Decision Record (spec-stage)

| Date | Type | Question / Gap | Resolution |
|------|------|----------------|------------|
| 2026-07-01 | Decision | Purpose & fidelity of the build | Client pitch to Total Jobs; clickable demo with simulated data. |
| 2026-07-01 | Decision | What the WhatsApp piece does | Real, conversational Claude agent via Twilio sandbox — the demo's hero moment. |
| 2026-07-01 | Decision | Deadline pressure | Target Friday 2026-07-03; soft — may bleed into next week. Kept full scope, sequenced. |
| 2026-07-01 | Decision | Twilio availability | User has a Twilio account (credentials to be provided). |
| 2026-07-01 | Decision | Branding source | User to provide official TJ brand kit; `total-jobs-site` tokens grounded as fallback/cross-check. Caterer = reskin of TJ system. |
| 2026-07-01 | Decision | Candidate authentication | Progressive/just-in-time: anonymous browse → phone-only inline "Apply in 20 sec" → progressive profiling → CV at recruiter interest. Recruiters log in upfront. Confirmed by user. |
| 2026-07-01 | Risk logged | Twilio sandbox join + 24h window could break the live hero | Documented as Known-Risks R1/R2 with run-book mitigations. |
| 2026-07-01 | Decision | App code location | New subfolder `caterer-dubai/`, specs/ alongside. |
| 2026-07-01 | Decision | Build/execution mode | Team mode (parallel streams: infra, candidate, recruiter, agent). |
| 2026-07-01 | prober-force (gap-fill) | Package tiers, seed venues, personas, agent breadth left open by discovery | Defaulted in spec (Starter/Pro/Enterprise AED tiers; Atlantis/Burj Al Arab/etc; hero available-chef persona) — flagged for veto in review. |
