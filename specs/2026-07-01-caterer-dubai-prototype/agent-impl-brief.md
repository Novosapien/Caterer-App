# Build brief: WhatsApp Gig Agent service (Python FastAPI + LangGraph)

Build the agent service into a NEW folder: `/Users/MaxKingaby/Programming/Total Jobs/caterer-agent/`
(sibling of `caterer-dubai/` and `specs/`).

## Read first (in order)
1. `/Users/MaxKingaby/.claude/skills/agent-implementation-builder/references/langgraph/CHEATSHEET.md` — LangGraph critical rules. Follow them.
2. `/Users/MaxKingaby/.claude/skills/agent-implementation-builder/references/langgraph/file-organization.md` — structure.
3. The spec: `/Users/MaxKingaby/Programming/Total Jobs/specs/2026-07-01-caterer-dubai-prototype/agent-spec/whatsapp-gig-agent.md` (THE authority — tools, orchestration/thread model, run-book, examples), plus `overview.md`, `manifest.yaml`, `agent-config.yaml` in that folder.
4. The shared DB schema (exact column names): `/Users/MaxKingaby/Programming/Total Jobs/caterer-dubai/supabase/migrations/0001_schema.sql` (tables: jobs, candidate_profiles, applications, whatsapp_threads, whatsapp_messages).

## What to build (per agent-spec/)
A FastAPI service hosting ONE LangGraph agent (Claude **Sonnet 5** via `langchain-anthropic`), using
`langgraph.prebuilt.create_react_agent` + `langgraph-checkpoint-postgres` (checkpointer on the Supabase
Postgres, keyed by `thread_id = thread_key`). Endpoints:

### `GET /health` → `{status: "ok"}` (keep-warm)

### `POST /notify` (outbound trigger; header `X-Notify-Secret` == env `NOTIFY_SHARED_SECRET`, else 401)
Request (MUST match the Next.js caller in `caterer-dubai/src/lib/agentClient.ts`):
```
{ "gig": { "gig_id","title","role_type","venue","location_area","pay_aed","pay_unit",
           "start_at","dress_code","description" },
  "candidates": [ { "candidate_id","name","phone" } ] }   # candidate_id == candidate_profiles.profile_id
```
Response: `{ "results": [ { "candidate_id","thread_key","status": "sent"|"pending" } ] }`
Per candidate: `thread_key = f"{candidate_id}:{gig_id}"`; upsert `whatsapp_threads` row as `active`
(last_activity_at=now) AND set every OTHER active thread for that phone to `closed` (one active per phone);
send the outbound WhatsApp invite via Twilio REST; log it as the first `whatsapp_messages` row
(direction='out'). If the send is blocked (not joined / >24h / any Twilio error) → `status='pending'`,
log, do NOT crash.

### `POST /webhook/whatsapp` (Twilio inbound; form fields `From`, `Body`)
1. Resolve `From` → the single `active` whatsapp_threads row → `(candidate_profile_id, job_id)`. None → send a
   polite "I can only chat about a gig I've sent you" reply, return 200, done.
2. Load gig (jobs) + candidate (candidate_profiles+profiles) → build the system prompt context.
3. Invoke the agent with `thread_id=thread_key`. Tools take NO id args — inject `job_id`+`candidate_profile_id`
   from the resolved thread (closure/partial). Tools: `get_gig_details`, `accept_gig`, `decline_gig`
   (Supabase; accept/decline = upsert `applications` on unique `(job_id,candidate_profile_id)` with
   status accepted/declined, source='whatsapp'; idempotent; return start_label human time).
4. Reply via Twilio REST (NOT TwiML); log inbound + outbound to whatsapp_messages; update last_activity_at.
   Return 200 promptly. ~15s turn budget; 1 retry @~500ms on transient Supabase errors.
Hospitality voice, concise, grounded ONLY in gig context (never invent pay/venue/time). Off-topic → warm
redirect to the gig. v1 scope: gig Q&A + accept/decline ONLY (no other-gig browsing / availability changes).

## Files (suggested)
`main.py` (FastAPI + endpoints), `src/config.py` (pydantic-settings), `src/clients/supabase.py`,
`src/clients/twilio_client.py`, `src/agent/graph.py` (create_react_agent + checkpointer + system prompt),
`src/agent/tools.py`, `src/agent/context.py` (load gig/candidate + thread routing), `requirements.txt`,
`.env.example`, `Dockerfile`, `README.md` (incl. the Twilio sandbox run-book from the spec + Cloud Run
`min-instances=1` note).

## Dependencies (requirements.txt)
langgraph, langgraph-checkpoint-postgres, langchain-core, langchain-anthropic, fastapi,
uvicorn[standard], pydantic, pydantic-settings, twilio, supabase, psycopg[binary] (+ optional langsmith).
Model: `ChatAnthropic(model=...)` — put the model id in config/env (`ANTHROPIC_MODEL`, default to the
current Claude Sonnet id); note in README that it resolves to the latest Sonnet.

## Env (.env.example)
`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_WHATSAPP_FROM` (sandbox number), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_DB_URL` (Postgres conn string for the checkpointer), `NOTIFY_SHARED_SECRET`.

## Constraints / verification
- Target Python 3.11 (Cloud Run). This sandbox has Python 3.9 and NO way to `pip install` the heavy stack
  or provide live creds — so do NOT attempt `pip install`/runtime. Instead verify with
  `python3 -m py_compile <each .py>` (syntax). Keep syntax broadly 3.9-parseable where trivial, but 3.11 is
  the runtime.
- Do not require live creds to import. Read env lazily.
- Match the `/notify` contract and DB column names EXACTLY (cross-check agentClient.ts + 0001_schema.sql).

## Report back
List files created, confirm `py_compile` passed on all .py, and note assumptions/stubs.
