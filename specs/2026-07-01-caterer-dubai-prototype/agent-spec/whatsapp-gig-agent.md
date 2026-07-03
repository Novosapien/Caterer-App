---
name: whatsapp-gig-agent
type: message-tool-agent
framework: langgraph
reference: agent-patterns/individual-agents/langgraph/message-tool-agent.md
prompt:
  framework: conversational
  role: conversational-assistant
  modifiers: [tools, memory]
model:
  provider: anthropic
  name: claude-sonnet-5
  reasoning: false
---

# WhatsApp Gig Agent

## Purpose

### Goal
Get an available chef from "you have an urgent gig" to "accepted" (or a clean decline) through a natural WhatsApp conversation, and record the outcome so the recruiter sees it.

### Approach
A single conversational LangGraph agent (message + tools). Each turn is loaded with the specific gig and candidate context; the agent answers questions from that context and, when the chef commits, calls `accept_gig` / `decline_gig` to write the outcome. Conversation history per (candidate, gig) thread is persisted and reloaded so the dialogue is coherent across messages.

### Primary Responsibility
Converse with one chef about one specific urgent gig and capture their accept/decline decision.

### Key Tasks
- Send the initial outbound gig invitation (via the `/notify` path).
- Answer gig questions: pay (AED), venue, start time, dress code, role.
- Detect and act on an accept ("I'm in", "yes", "count me in") or decline ("can't tonight", "no").
- Redirect off-topic messages back to the gig, on-brand.

### Success Criteria
- Accurate answers grounded ONLY in the provided gig context (no invented details).
- A clear accept produces exactly one `applications` row (`status=accepted, source=whatsapp`), idempotently.
- Replies are concise, warm, hospitality-voiced, and mobile-friendly (short).

### Scope Boundaries (v1)
- Handles ONE gig per conversation thread.
- Does NOT browse/suggest other gigs, change candidate availability, negotiate pay, or schedule interviews. (Deferred — see `../spec.md` C11 note / discovery Q2.)

## Framework & Role Reasoning

**Framework:** Conversational
**Why:** Multi-turn back-and-forth over WhatsApp; the chef asks questions before deciding. State must persist across messages.

**Role:** conversational-assistant
**Why:** Assists a user in dialogue toward a decision; not generating original content or classifying/routing.

## LLM Configuration

| Setting | Value | Reasoning |
|---------|-------|-----------|
| **Provider** | anthropic | Novosapien standard; strong tool-use + instruction following |
| **Model** | claude-sonnet-5 | Quality/latency balance for real-time chat |
| **Reasoning** | No | Scoped task; extended thinking would add latency to a live chat |
| **Temperature** | 0.4 | Warm and natural, but consistent and grounded |

**Notes:** Latency matters for the live demo — keep replies short; Cloud Run `min-instances=1` to avoid cold starts.

## Modifiers

### Tools
**Needed:** Yes

#### Tool Summary Table

| Tool | Purpose | Implementation | Documentation |
|------|---------|----------------|---------------|
| get_gig_details | Fetch the current gig's details from Supabase | custom-function | Supabase JS/Py client |
| accept_gig | Record the chef accepting the gig | custom-function | Supabase client |
| decline_gig | Record the chef declining the gig | custom-function | Supabase client |

#### Tool Specifications

Gig and candidate context are **preloaded** into the agent's context each turn (from Supabase, keyed by thread). `get_gig_details` exists as a fallback/refresh; `accept_gig` / `decline_gig` are the write actions.

---

### get_gig_details

**Purpose:** Return the up-to-date details of the gig this conversation is about.
**When to use:** If the chef asks something not already in context, or to confirm the gig is still open.
**Implementation type:** custom-function

#### Custom Function Implementation
**Algorithm/Logic:**
```
1. Look up gig by gig_id in Supabase `jobs`
2. Return relevant fields (title, venue, location_area, pay_aed, pay_unit, start_at, is_urgent, status, description)
3. If gig not found or status != open, indicate closed/unavailable
```
**Dependencies:** supabase (service-role client)
**Edge cases:**
| Case | Handling |
|------|----------|
| Gig not found | Return `{found: false}` → agent tells chef the gig is no longer available |
| Gig status = closed/filled | Return `{status: "filled"}` → agent informs chef gracefully |

#### Tool Parameters
```python
# No LLM-supplied parameters. gig_id is INJECTED by the webhook handler from the
# resolved thread context; the LLM calls get_gig_details() with no arguments.
class GetGigParams(BaseModel):
    pass
```
#### Tool Response
```python
class GigDetails(BaseModel):
    found: bool
    title: str | None
    venue: str | None
    location_area: str | None
    pay_aed: float | None
    pay_unit: str | None       # 'shift' | 'hour' | 'day'
    start_at: str | None       # ISO datetime
    dress_code: str | None
    status: str | None         # 'open' | 'filled' | 'closed'
    description: str | None
```

---

### accept_gig

**Purpose:** Record that the chef has accepted the gig.
**When to use:** The chef clearly commits ("I'm in", "yes please", "count me in").
**Implementation type:** custom-function

#### Custom Function Implementation
**Algorithm/Logic:**
```
1. Upsert an `applications` row (job_id, candidate_profile_id, status='accepted', source='whatsapp')
2. Idempotent: if an accepted row already exists for (job, candidate), do not duplicate
3. Return confirmation payload (gig title, start time) for the agent to echo
```
**Dependencies:** supabase (service-role client)
**Edge cases:**
| Case | Handling |
|------|----------|
| Already accepted | Return `{already: true}` → agent re-confirms, no duplicate row |
| Gig now filled/closed | Return `{status: "filled"}` → agent tells chef it just filled, apologizes |

#### Tool Parameters
```python
# IDs INJECTED from thread context by the handler (LangGraph state / closure).
# The LLM calls accept_gig() with NO arguments — it decides only WHICH tool to call.
class AcceptGigParams(BaseModel):
    pass   # gig_id + candidate_profile_id bound server-side, never emitted by the LLM
```
#### Tool Response
```python
class AcceptGigResult(BaseModel):
    ok: bool
    already: bool = False
    status: str            # 'accepted' | 'filled' | 'closed'
    gig_title: str | None
    start_at: str | None   # ISO 8601
    start_label: str | None  # pre-formatted human Dubai time, e.g. "tonight at 7pm" — agent echoes this
```

---

### decline_gig

**Purpose:** Record that the chef has declined the gig.
**When to use:** The chef clearly declines ("can't tonight", "no thanks").
**Implementation type:** custom-function

#### Custom Function Implementation
**Algorithm/Logic:**
```
1. Upsert an `applications` row (job_id, candidate_profile_id, status='declined', source='whatsapp')
2. Idempotent on (job, candidate)
3. Return confirmation for a warm sign-off
```
**Dependencies:** supabase (service-role client)

#### Tool Parameters
```python
# IDs INJECTED from thread context by the handler. LLM calls decline_gig() with NO args.
class DeclineGigParams(BaseModel):
    pass   # gig_id + candidate_profile_id bound server-side, never emitted by the LLM
```
#### Tool Response
```python
class DeclineGigResult(BaseModel):
    ok: bool
    status: str  # 'declined'
```

---

#### Error Handling (all tools)

| Error Scenario | Detection | Response |
|----------------|-----------|----------|
| Supabase write fails | Exception / non-2xx | Agent apologizes, asks chef to reply again shortly; error logged |
| Missing candidate/gig context | Null IDs | Agent sends the "I can only chat about a gig I've sent you" fallback |

**Retry strategy:** One retry with short backoff on transient Supabase errors.
**Fallback behavior:** Never fabricate success; if the write can't be confirmed, tell the chef it didn't go through.

### Structured Output
**Needed:** No — the agent returns a natural-language WhatsApp reply; actions happen via tools.

### Memory
**Type:** Conversation History (per thread)
What persists: conversation history is held by the **LangGraph Postgres checkpointer**, keyed by `thread_id = thread_key`. It is **not** re-assembled by hand each turn (see Orchestration & Thread Model). `whatsapp_messages` is a **mirror** written for the app/dashboard's benefit (and to log the initial `/notify` invitation), not the agent's memory source.

### Reasoning
**Technique:** None (temperature-controlled direct responses; keep latency low).

## Inputs

| Input | Description | Format | Source |
|-------|-------------|--------|--------|
| inbound_message | The chef's WhatsApp message | text (Twilio form: From, Body) | Twilio webhook |
| gig_context | The gig this thread is about | JSON (preloaded) | Supabase `jobs` |
| candidate_context | The chef's name + candidate_id + phone | JSON (preloaded) | Supabase `candidate_profiles` |
| thread_history | Prior messages in this thread | LangGraph state | LangGraph Postgres checkpointer (keyed by `thread_key`); mirrored to `whatsapp_messages` for the app |

## Outputs

| Output | Description | Format | Consumed By |
|--------|-------------|--------|-------------|
| reply_message | The agent's WhatsApp reply | text | Twilio → chef |
| application_write | Accept/decline record | DB row | Supabase → recruiter dashboard |
| message_log | Inbound + outbound logged | DB rows | Supabase `whatsapp_messages` |

## Field Ownership

| Field | Ownership | Description |
|-------|-----------|-------------|
| reply_message | LLM-produced | The natural-language reply |
| applications.status | LLM-triggered, code-written | Agent decides accept/decline; tool writes the exact enum |
| applications.job_id | Code-injected | Bound into the tool call by the handler from the resolved thread; the LLM never sees or emits it |
| applications.candidate_profile_id | Code-injected | Bound into the tool call by the handler from the resolved thread; the LLM never sees or emits it |
| applications.source | Code-resolved | Always `'whatsapp'`, set by the tool |

**Why this matters:** The LLM must never fabricate IDs. `job_id` and `candidate_profile_id` are **injected** into the tool callables by the webhook handler (via LangGraph state / closure) from the resolved `whatsapp_threads` row — the tools take no ID arguments, so the LLM only decides *which action* to take, never *which record*.

## Context Flow

**Upstream:**
- Next.js `/notify`: gig + matched candidates (triggers outbound)
- Twilio webhook: inbound chef message

**Downstream:**
- Supabase: application + message log
- Twilio: outbound reply
- Next.js recruiter dashboard: reads the application via Realtime/poll

## Domain Context

**Business Context:** Caterer Dubai pitch prototype — the WhatsApp hero loop.
**User Context:** Chefs/waiters/catering crew in Dubai, on the go, replying on WhatsApp.
**Constraints:**
- Hospitality voice — warm, upbeat, urgent; NOT corporate. Concise (WhatsApp-length).
- AED currency; Dubai venues.
- Ground every gig fact in provided context; never invent pay/venue/time.
- Twilio **sandbox** constraints apply (join + 24h window — see Run-book).

## Behavioral Requirements

### Key Behaviors
- Open with a short, warm gig pitch (role, venue, AED pay, start time) + a clear ask ("Can you take it?").
- Answer questions crisply from context; if a detail is unknown, say so rather than guess.
- Recognize accept/decline from varied/informal phrasing and colloquialisms.
- Confirm an acceptance explicitly and warmly ("You're in! 🎉 …").
- Keep messages short — 1–3 sentences, WhatsApp-appropriate.

### Edge Cases

| Case | How to Handle |
|------|---------------|
| Off-topic message ("what's the weather?") | Friendly redirect to the gig; do not answer the off-topic query (EC6) |
| Ambiguous reply ("maybe", "how much again?") | Ask one clarifying question / restate the key detail; do not write an application |
| Accept after gig already filled | Apologize warmly, say it just filled; do not write an accepted row |
| Double accept | Idempotent — re-confirm, no duplicate row |
| Unknown sender / no active thread | "Hi! I can only chat about a gig I've sent you." — no gig invented |
| Chef asks to change availability / see other gigs | Politely say that's coming soon; keep to this gig (v1 scope) |
| Supabase/Twilio write failure | Apologize, ask to resend shortly; log; never fake success |
| Outbound blocked (not joined / >24h window) | `/notify` marks candidate "notification pending"; logged; run-book pre-empts this (EC3) |

### What This Agent Should NOT Do
- Invent gig details, pay, or IDs.
- Negotiate pay or terms.
- Handle more than the one gig in the thread.
- Send long, corporate-sounding messages.

## Examples

### Example 1: Question then accept (happy path)

**Input (thread context + inbound):**
```
gig_context: {gig_id: "g_123", title: "Chef de Partie", venue: "Atlantis The Palm",
              location_area: "Palm Jumeirah", pay_aed: 320, pay_unit: "shift",
              start_at: "2026-07-01T19:00:00+04:00", dress_code: "Chef whites", status: "open"}
candidate_context: {candidate_id: "c_45", name: "Yusuf"}
inbound_message: "what's the pay?"
```
**Output (reply 1):**
```
Hi Yusuf! It's AED 320 for tonight's shift at Atlantis The Palm (Palm Jumeirah),
starting 7pm, chef whites. Can you take it? 🔥
```
**Input (reply):**
```
inbound_message: "yeah I'm in"
```
**Action:** `accept_gig()` — no args; `gig_id`/`candidate_profile_id` injected from the resolved thread → `{ok: true, status: "accepted", gig_title: "Chef de Partie", start_label: "tonight at 7pm"}`
**Output (reply 2):**
```
You're in, Yusuf! 🎉 Chef de Partie at Atlantis, 7pm tonight. The team will see
you've accepted — see you there!
```

### Example 2: Off-topic redirect (EC6)

**Input:**
```
inbound_message: "lol what's the weather like there"
```
**Output:**
```
Ha! Can't help with the forecast 😄 — but I've got a Chef de Partie shift at
Atlantis tonight, AED 320, 7pm. Want it?
```

## Orchestration & Thread Model

### Thread identity
- `thread_key = "{candidate_profile_id}:{job_id}"`. This is **also the LangGraph `thread_id`** used by the Postgres checkpointer, so conversation history persists per thread automatically (no hand-rolled history reload).
- Table **`whatsapp_threads`** (defined in `../spec.md`): `thread_key` (pk), `phone` (E.164), `candidate_profile_id`, `job_id`, `status` (`'active'|'closed'`), `last_activity_at`.

### Outbound — `POST /notify`
- **Auth:** header `X-Notify-Secret` compared constant-time to `NOTIFY_SHARED_SECRET`; `401` on mismatch.
- **Concrete contract:**
```python
class NotifyCandidate(BaseModel):
    candidate_id: str
    name: str
    phone: str            # E.164, e.g. "+971501234567"

class NotifyGig(BaseModel):
    gig_id: str
    title: str
    role_type: str
    venue: str
    location_area: str
    pay_aed: float
    pay_unit: str         # 'shift' | 'hour' | 'day'
    start_at: str         # ISO 8601
    dress_code: str | None = None
    description: str | None = None

class NotifyRequest(BaseModel):
    gig: NotifyGig
    candidates: list[NotifyCandidate]

class NotifyResult(BaseModel):
    candidate_id: str
    thread_key: str
    status: str           # 'sent' | 'pending'  (pending = blocked send: not joined / >24h window)

class NotifyResponse(BaseModel):
    results: list[NotifyResult]
```
- **Per candidate:** upsert the `whatsapp_threads` row as `active` (`last_activity_at=now`) **and mark every other active thread for that phone as `closed`** → guarantees exactly one active thread per phone (deterministic inbound routing). Send the outbound WhatsApp (Twilio REST) and **log it as the first `whatsapp_messages` row** (`direction='out'`). If the send is blocked → result `status='pending'`, log the attempt, never crash (EC3).
- **Multi-gig limitation (v1, demo-acceptable):** newest notification wins — a prior gig's thread for that phone is closed when a newer gig pings it. A production system would disambiguate; explicitly out-of-scope for the prototype.

### Inbound — `POST /webhook/whatsapp`
Twilio posts form fields (`From` phone, `Body` text). The handler:
1. **Resolve** the thread by `From` → the single `active` `whatsapp_threads` row → `(candidate_profile_id, job_id)`. If none → unknown-sender fallback reply, return `200`, log optionally.
2. **Assemble `ConversationContext`** = `{gig: <loaded from jobs>, candidate: <loaded from candidate_profiles>}`. Conversation history is held by the LangGraph checkpointer (keyed by `thread_key`) — not re-assembled by hand.
3. **Invoke** the LangGraph agent with `thread_id=thread_key`, passing the inbound message + gig/candidate context (interpolated into the system prompt / seeded into state).
4. **IDs injected, not model-produced:** the handler binds `gig_id` + `candidate_profile_id` into the tool callables (LangGraph state / closure), so the LLM calls `accept_gig()` / `decline_gig()` with no arguments.
5. **Reply via Twilio REST API** (not TwiML); log the outbound message; update `last_activity_at`. Return `200` promptly so Twilio doesn't time out (agent work completes within a ~15s budget before the REST reply).

### Reliability
- Supabase transient errors (network/5xx/timeout): 1 retry after ~500ms, then apologize + ask the chef to resend; never fake success.
- Agent turn budget ~15s; keep replies short.

## Framework, Packages & Scalability

### v1 implementation (this spec)
Plain LangGraph — **`langgraph.prebuilt.create_react_agent`** (message + tools loop) with a **Postgres checkpointer** (`langgraph-checkpoint-postgres`) on the Supabase Postgres, keyed by `thread_id = thread_key`. No custom graph, no planning layer, no subagents — the task is a scoped, stateful, tool-using conversation, which `create_react_agent` + a checkpointer covers directly.

**Dependencies:**
```
# agent
langgraph
langgraph-checkpoint-postgres
langchain-core
langchain-anthropic
# service
fastapi
uvicorn[standard]
pydantic
pydantic-settings
# integrations
twilio
supabase
psycopg[binary]
# optional observability
langsmith
```
Model binding: `ChatAnthropic(model="<current Sonnet id>")` — resolve `claude-sonnet-5` to the exact Anthropic model string at build time (per the `claude-api` skill). Do **not** add the `langchain` meta-package.

### Scale-up path (NOT v1)
When this evolves into the vault's persistent **"career advisor"** (plans over long horizons, browses/negotiates gigs, manages availability across many sessions, delegates to a fleet of subagents, uses skills/memory), migrate to the **LangChain Deep Agents SDK** (`deepagents` / `create_deep_agent`), which bundles planning + subagents + memory/filesystem + human-in-the-loop on top of LangGraph. **Trigger for adoption:** planning + a subagent fleet + long-lived cross-session memory — NOT merely "multi-turn + history + tools" (which plain LangGraph already provides).

## Run-book (Twilio Sandbox) — required for the live demo

1. **Join (one-time per phone):** each demo recipient sends `join <sandbox-keyword>` to the Twilio sandbox WhatsApp number. Do this for the hero chef's phone (and any stakeholder phone that will receive a message) BEFORE the pitch.
2. **24-hour window:** Twilio sandbox freeform outbound only works within 24h of the recipient's last inbound message. Have the hero chef send any message to the sandbox shortly before the demo (re-opens the window). If outside the window, outbound is blocked → `/notify` returns that candidate as "pending".
3. **Webhook config:** point the Twilio sandbox "when a message comes in" webhook at `POST {agent-service-url}/webhook/whatsapp`.
4. **Keep-warm:** Cloud Run `min-instances=1`; optionally ping `/health` before the demo.
5. **Fallback:** keep a screen-recorded clip of the exchange as insurance (spec `R15`).

## Notes
- `applications` schema, `matching.ts`, and dashboard reflection are owned by the general spec (`../spec.md`). This agent consumes those contracts.
- Gig/candidate context is preloaded per turn to keep the conversation grounded and fast; `get_gig_details` is a refresh/fallback tool.
