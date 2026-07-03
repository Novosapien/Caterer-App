# Agent-Spec Review 002 — Re-check (post-fix)

Verifies the fixes applied after review-002's FAIL. Read-only re-verification.

## Result

| Dimension | Pre-fix | Post-fix |
|-----------|---------|----------|
| Ambiguity | FAIL (3 HIGH, 6 MED) | **PASS** (0 blocking) |
| Structural | WARN (2) | **PASS** (0) |
| Source Tracing | PASS | PASS |
| Reality Grounding | WARN | PASS |
| Test Derivability | PASS | PASS |
| **Overall** | **FAIL** | **PASS** |

## Findings re-checked (all resolved)

| # | Finding | Resolved | Evidence |
|---|---------|----------|----------|
| 1 | Inbound phone→thread routing | YES | `whatsapp_threads`, one `active` per phone (newest-wins), deterministic resolution |
| 2 | `thread_key` format/reconstruction | YES | `"{candidate_profile_id}:{job_id}"` = LangGraph `thread_id`; resolved via phone→active thread |
| 3 | Tool-ID injection contradiction | YES | Tools take no ID args; handler injects; Field Ownership = "Code-injected" |
| 4 | `/notify` concrete schema | YES | `NotifyRequest`/`NotifyResponse` pydantic models |
| 5 | Shared secret | YES | `X-Notify-Secret`, constant-time, 401 |
| 6 | Preloaded context handoff | YES | `ConversationContext {gig, candidate}`; history via checkpointer |
| 7 | `jobs` field mismatch | YES | `spec.md` jobs → `location_area`, `dress_code`, `status` enum |
| 8 | Idempotent upsert target | YES | UNIQUE `(job_id, candidate_profile_id)`; upsert absorbs prior row |
| 9 | Retry/timeout | YES | 1 retry @500ms; ~15s budget; 200-ack + Twilio REST reply |
| F1/F2 | Structural field WARNs | YES (cleared) | jobs schema reconciliation |

## Cosmetic cleanups also applied
- Memory + Inputs `thread_history` text updated to reflect the checkpointer (not manual reload).
- `overview.md` endpoint output changed from "TwiML" to "200 ack + Twilio REST reply".
- Example 1 tool call changed to no-args `accept_gig()`.

## Bottom line
Agent spec is **implementation-ready**. No blocking issues remain.
