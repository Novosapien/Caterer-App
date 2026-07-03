---
# Machine-readable verdict. POST-FIX state (original FAIL findings resolved + re-verified).
# Original verdict was FAIL (3 HIGH); all resolved — see body + Resolution + recheck below.
review_verdict:
  overall: PASS              # post-fix; re-verified PASS/PASS (see review-002-recheck.md)
  blocking_count: 0
  warning_count: 0
  dimensions:
    structural: PASS         # F1/F2 cleared by jobs-schema reconciliation
    source_tracing: PASS
    ambiguity: PASS          # 3 HIGH + 6 MEDIUM all resolved
    reality_grounding: PASS  # schema now internally consistent
    test_derivability: PASS
  spec_path: specs/2026-07-01-caterer-dubai-prototype/agent-spec/manifest.yaml
  reviewed: 2026-07-01
  resolution: applied        # fixes applied to agent-spec + spec.md; re-verified
  original_verdict: FAIL     # audit trail — see findings + Resolution section in body
---

# Agent-Spec Review: WhatsApp Gig Agent (component C11)

| Field | Value |
|-------|-------|
| **Reviewed** | 2026-07-01 |
| **Review #** | 002 |
| **Spec Type** | Agent (single-agent, LangGraph) |
| **Spec Path** | agent-spec/ (entry `agent-spec/manifest.yaml`) |
| **Discovery Path** | discovery.md · General spec: spec.md |

---

## 1. Structural Checks — WARN (0 blocking, 2 warnings, 2 nits)

Checks 1–13 run; 3 (team folders), 14 (DSPy), 15 (instances) = N/A (single-agent LangGraph).

- **F1 (WARN):** agent reads `jobs.location_area` but `spec.md` `jobs` had `location` (only `candidate_profiles` had `location_area`). Field-name mismatch across the boundary.
- **F2 (WARN):** agent grounds on `dress_code` but `jobs` had no `dress_code` column.
- **F3 (nit):** `jobs.status` enum assumed (`open/filled/closed`) but not pinned in schema.
- **F4 (nit):** tool param `candidate_id` vs DB `candidate_profile_id` — documented as pass-through in Field Ownership, acceptable.
All other I/O consistent (`applications.status/source/job_id/candidate_profile_id`, `whatsapp_messages`).

## 2. Source Tracing — PASS (0 blocking, 0 warnings)

~96% coverage. Every requirement from discovery §2b/§9/§10-Q2 and spec R8/R9/R15/C10/C11 has a home. Next.js→separate-service drift cleanly reconciled. One LOW note: discovery §2b's raw "updates availability" was deliberately deferred via Q2/C11 (correct resolution).

## 3. Ambiguity Analysis — FAIL (3 HIGH, 6 MEDIUM, 4 LOW)

| # | Severity | Category | Ambiguity |
|---|----------|----------|-----------|
| 1 | HIGH | 9/7 | Inbound webhook (phone+body only) → which `(candidate, gig)` thread, esp. with multiple active gigs? |
| 2 | HIGH | 8/3 | `thread_key` format + how reconstructed on inbound from phone only — undefined |
| 3 | HIGH | 8 | Tools declare `gig_id`/`candidate_id` params, but Field Ownership forbids LLM-produced IDs — injection mechanism unspecified |
| 4 | MEDIUM | 8/1 | `/notify` `NotifyRequest`/`NotifyResponse` concrete field schemas undefined |
| 5 | MEDIUM | 8/3 | Shared-secret mechanism (header, validation, reject code) undefined |
| 6 | MEDIUM | 3/7 | "Preloaded context" assembly + handoff to the LangGraph agent loose |
| 7 | MEDIUM | 5/8 | `get_gig_details` returns `dress_code`/`location_area` not matching `jobs` schema (= F1/F2) |
| 8 | MEDIUM | 2/8 | Idempotent upsert conflict target on `applications` undefined; interaction with prior `applied`/`app` row |
| 9 | MEDIUM | 9 | Retry backoff/transient-error classes + LLM/webhook timeout unquantified |
| 10 | LOW | 2/8 | Whether outbound invitation + blocked sends are logged to `whatsapp_messages` |
| 11 | LOW | 1 | `start_at` timezone/format echoed to chef left to LLM |
| 12 | LOW | 2/9 | Unknown-sender: return 200? logged? |
| 13 | LOW | 3 | `claude-sonnet-5` → concrete Anthropic model id resolution |

## Grounding & Testability (lead-run)

| Check | Status | Notes |
|-------|--------|-------|
| Data contracts cite real source | WARN | Twilio/Anthropic real; Supabase schema greenfield — but jobs-field mismatch (#7) + undefined `/notify`/`thread_key` shapes |
| Scale present | PASS | Demo scale |
| Known-Risks present | PASS | Twilio join/24h/off-script all carried |
| Every requirement → concrete test | PASS | Worked examples + edge cases present |

## Overall (pre-fix)

| Dimension | Verdict | Blocking | Warnings |
|-----------|---------|----------|----------|
| Structural | WARN | 0 | 2 |
| Source Tracing | PASS | 0 | 0 |
| Ambiguity | FAIL | 3 | 6 |
| Reality Grounding | WARN | 0 | 1 |
| Test Derivability | PASS | 0 | 0 |
| **Overall** | **FAIL** | **3** | **8** |

---

## Resolution (applied 2026-07-01, spec-defect loopback)

All 3 HIGH + all 6 MEDIUM resolved in `agent-spec/whatsapp-gig-agent.md` + `overview.md` and reconciled into `spec.md`:

- **#1/#2 (thread routing + key):** Added a **`whatsapp_threads`** table (`thread_key = "{candidate_profile_id}:{job_id}"`, `phone`, `candidate_profile_id`, `job_id`, `status`, `last_activity_at`). On `/notify`, upsert the thread **active** and **close any other active thread for that phone** → exactly one active thread per phone. Inbound resolves deterministically by phone → active thread. Multi-gig limitation (newest-notification-wins) documented as a demo-acceptable constraint.
- **#3 (tool IDs):** `accept_gig`/`decline_gig`/`get_gig_details` take **no LLM-supplied IDs**; the webhook handler **injects** `gig_id`+`candidate_profile_id` from the resolved thread into the tool calls (LangGraph state / closure). LLM decides only *which* tool to call. Field Ownership updated.
- **#4 (`/notify` schema):** concrete `NotifyRequest`/`NotifyResponse` added.
- **#5 (shared secret):** `X-Notify-Secret` header, constant-time compare, 401 on mismatch.
- **#6 (preloaded context):** `ConversationContext {gig, candidate, history}` assembled by the handler → LangGraph initial state; system prompt interpolates gig+candidate; history seeded.
- **#7 (jobs fields):** `spec.md` `jobs` now uses `location_area`, adds `dress_code`, pins `status ('open'|'filled'|'closed')`.
- **#8 (idempotency):** unique constraint `applications (job_id, candidate_profile_id)`; accept/decline upsert on that target (updates status+source).
- **#9 (retry/timeout):** webhook 200-acks immediately, agent replies via Twilio REST (not TwiML); Supabase transient errors → 1 retry @500ms; ~15s turn budget.
- **#10–#13 (LOW):** outbound invitation + blocked sends logged; tools return a human `start_label`; unknown sender → 200 + fallback (logged); `claude-sonnet-5` resolved to the current Anthropic Sonnet id at build (per `claude-api`).

**Re-verification:** ambiguity dimension re-run after fixes → see `reviews/review-002-recheck.md`.
