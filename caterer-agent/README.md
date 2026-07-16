# WhatsApp Gig Agent (Caterer Dubai prototype)

A FastAPI + LangGraph service that WhatsApp-notifies matched available chefs about
an urgent catering gig and handles their accept/decline conversationally. This is
component **C11** of the Caterer Dubai pitch prototype; the Next.js app, API, and
frontend live in the sibling `caterer-dubai/` project.

One LangGraph agent (Claude **Sonnet 5** via `langchain-anthropic`), built with
`langgraph.prebuilt.create_react_agent` and a `langgraph-checkpoint-postgres`
checkpointer on the Supabase Postgres, keyed by `thread_id = thread_key`.

## Architecture

```
Next.js /notify ──▶ POST /notify ──▶ Unipile (freeform invite) ──▶ chef's WhatsApp
                                     └─ create/refresh whatsapp_threads + log
chef replies ──▶ Unipile webhook ──▶ POST /webhook/whatsapp  (JSON message event)
                             ├─ resolve active thread (phone → job_id, candidate)
                             ├─ load gig + candidate context (Supabase)
                             ├─ LangGraph agent (Sonnet 5): get_gig_details,
                             │      accept_gig, decline_gig  (ids injected)
                             └─ reply into the Unipile chat + log + touch thread
```

WhatsApp goes through **Unipile** — a real WhatsApp account connected via QR — so
business-initiated first messages are freeform (no template approval) and the
agent can reach opted-in chefs proactively, any time.

## Endpoints

- `GET /health` → `{"status": "ok"}` — keep-warm / readiness.
- `POST /notify` — outbound trigger. Header `X-Notify-Secret` must equal
  `NOTIFY_SHARED_SECRET` (else `401`). Request/response match the Next.js caller
  in `caterer-dubai/src/lib/agentClient.ts`:

  ```json
  {
    "gig": { "gig_id", "title", "role_type", "venue", "location_area",
             "pay_aed", "pay_unit", "start_at", "dress_code", "description" },
    "candidates": [ { "candidate_id", "name", "phone" } ]
  }
  ```

  Response: `{ "results": [ { "candidate_id", "thread_key", "status": "sent"|"pending" } ] }`.

  Per candidate: `thread_key = "{candidate_id}:{gig_id}"`; the `whatsapp_threads`
  row is upserted as `active` (and every other active thread for that phone is
  set to `closed` — one active thread per phone); the invite is sent via Unipile
  (a freeform new-chat message) and logged as the first `whatsapp_messages` row
  (`direction='out'`). A blocked send (unreachable number / any Unipile error) →
  `status='pending'` (logged, never crashes).

- `POST /webhook/whatsapp` — Unipile inbound (JSON message event). Parses the
  sender's provider id → E.164, the message text, and the `chat_id`; echoes of the
  connected account's own outbound are ignored. Resolves the single `active` thread
  for the sender; unknown senders get a polite fallback reply into the same chat.
  Otherwise it loads the gig + candidate, runs the agent (`thread_id=thread_key`),
  replies into the Unipile chat via `reply_in_chat`, logs both messages, and bumps
  `last_activity_at`. Always acks `200` promptly.

## Model

`ChatAnthropic(model=ANTHROPIC_MODEL)` — defaults to `claude-sonnet-5`, which
resolves to the **latest Claude Sonnet**. Override via the `ANTHROPIC_MODEL` env
var. Temperature `0.4`; extended thinking off (latency matters for live chat).

## Configuration

See `.env.example`. Required env: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`,
`UNIPILE_DSN`, `UNIPILE_API_KEY`, `UNIPILE_ACCOUNT_ID` (the connected WhatsApp
account), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (Postgres
conn string for the checkpointer), `NOTIFY_SHARED_SECRET`. Optional:
`LANGSMITH_API_KEY`.

All env is read lazily, so the service imports without credentials (only endpoints
that need a credential fail, per-request).

## Local run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
uvicorn main:app --reload --port 8080
```

Target runtime is Python 3.11.

## Deploy (Cloud Run)

Build and deploy the image; set `min-instances=1` to avoid cold-start latency at
the live-demo wow moment:

```bash
gcloud run deploy caterer-agent \
  --source . \
  --region europe-west1 \
  --min-instances=1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_MODEL=claude-sonnet-5,UNIPILE_DSN=api8.unipile.com:13851 \
  --set-secrets ANTHROPIC_API_KEY=...,UNIPILE_API_KEY=...,UNIPILE_ACCOUNT_ID=...,SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...,SUPABASE_DB_URL=...,NOTIFY_SHARED_SECRET=...
```

> `min-instances=1` keeps one warm instance so the first WhatsApp round-trip in
> the demo isn't paying a cold start. Optionally ping `/health` shortly before
> the pitch.

## Run-book — Unipile (required for the live demo)

1. **Connect the WhatsApp account (one-time):** in the Unipile dashboard, add a
   WhatsApp account and scan the QR with the phone that will be the sender. Copy the
   account's **DSN** (host:port), **API key**, and **account id** into env. Because
   this is a real connected account, first messages are freeform — recipients do
   **not** need to join anything or message first.
2. **Webhook config:** in Unipile, create a **messaging** webhook pointed at
   `POST {agent-service-url}/webhook/whatsapp` so inbound replies reach the agent.
   The handler parses Unipile's JSON payload tolerantly and ignores echoes of the
   account's own outbound; if a future API version renames fields, check the logged
   payload and adjust `_parse_unipile_message` in `main.py`.
3. **Keep-warm:** Cloud Run `min-instances=1`; optionally ping `/health` before
   the demo.
4. **Fallback:** keep a screen-recorded clip of the exchange as insurance.

## Files

- `main.py` — FastAPI app + `/health`, `/notify`, `/webhook/whatsapp`.
- `src/config.py` — pydantic-settings config (lazy).
- `src/clients/supabase.py` — Supabase service-role client (lazy).
- `src/clients/unipile_client.py` — Unipile WhatsApp send (new chat) + reply.
- `src/agent/context.py` — thread routing + gig/candidate loading + message log.
- `src/agent/tools.py` — `get_gig_details`, `accept_gig`, `decline_gig` (ids injected).
- `src/agent/prompts.py` — hospitality-voiced system prompt builder.
- `src/agent/graph.py` — `create_react_agent` + Postgres checkpointer + turn runner.
