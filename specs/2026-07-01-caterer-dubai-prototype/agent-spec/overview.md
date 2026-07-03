---
system: whatsapp-gig-agent
type: single-agent
framework: langgraph
status: draft
date: 2026-07-01
---

# WhatsApp Gig Agent — Overview

> The agent component (chunk **C11**) of the Caterer Dubai pitch prototype. The app/API/frontend are specified in the sibling `../spec.md`; this folder specifies only the conversational WhatsApp agent and its service.

## Purpose & Context

### Problem Statement
Catering temp work is urgent ("3 chefs needed tonight"). On-the-go chefs won't reliably check a web app in time. The agent reaches available chefs where they already are — WhatsApp — and lets them accept a gig conversationally in seconds. This is the demo's hero moment: a real WhatsApp message on a real phone during the pitch.

### Why Agents
The chef replies in free-form natural language ("what's the pay?", "where is it?", "I'm in", "not tonight, sorry"). A rules bot can't hold a natural hospitality-voiced conversation, answer varied gig questions, and detect an accept/decline from messy phrasing. An LLM agent handles the open-ended dialogue and maps it to a concrete accept/decline action.

### Success Criteria
- Publishing an URGENT gig delivers a **real** WhatsApp message to each matched available candidate.
- The agent answers gig questions (pay/venue/time/dress code) accurately from the gig context, in hospitality voice.
- On accept, an `applications` row (`status=accepted, source=whatsapp`) is written and the recruiter dashboard reflects it.
- Off-topic messages get a graceful, on-brand redirect (never an error or hallucinated gig).

## System Architecture

### Architecture Diagram

```
   NEXT.JS APP (Vercel)                      AGENT SERVICE (FastAPI + LangGraph, Cloud Run min-inst=1)
   recruiter publishes URGENT gig            ┌──────────────────────────────────────────────┐
   → write gig to Supabase                   │  POST /notify   {gig, candidates[]}            │
   → matching.ts selects candidates          │     → send outbound WhatsApp per candidate     │
        │  POST /notify ───────────────────▶ │     → create thread + log message              │
        │                                     │                                                │
   recruiter dashboard ◀── Supabase Realtime │  POST /webhook/whatsapp  (Twilio inbound)      │
        ▲                                     │     → load gig + candidate + thread (Supabase) │
        │ (5) application row                 │     → LangGraph message-tool-agent (Sonnet 5)  │
        │                                     │        tools: get_gig_details,                 │
   ┌────┴─────────┐                           │               accept_gig, decline_gig          │
   │  SUPABASE    │ ◀─── read/write ───────── │     → reply via Twilio + log message           │
   │  Postgres    │                           │  GET /health   (keep-warm)                      │
   └──────────────┘                           └───────────────────▲────────────────────────────┘
                                                                   │ Twilio WhatsApp (sandbox)
                                                                   ▼
                                                            chef's WhatsApp 📱
```

### Teams & Agents Summary

| Agent | Pattern | Purpose | Spec File |
|---|---|---|---|
| whatsapp-gig-agent | single agent (message-tool) | Converse with a chef about one urgent gig; accept/decline | `whatsapp-gig-agent.md` |

### Data Flow

| Stage | Input From | Output To | Data Description |
|---|---|---|---|
| Notify | Next.js `/notify` | Twilio → chef | Gig summary + candidate list; outbound WhatsApp messages |
| Converse | Twilio webhook | LangGraph agent | Chef's inbound message + loaded gig/candidate/thread context |
| Act | Agent tool | Supabase | `applications` row on accept/decline; `whatsapp_messages` log |
| Reflect | Supabase | Next.js dashboard | Realtime/poll surfaces the acceptance to the recruiter |

## Key Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Substrate | Separate FastAPI + LangGraph service (not in Next.js) | User preference; cleaner agent tooling/observability; hosts the conversation loop |
| 2 | Framework | LangGraph (not DSPy) | Conversational multi-turn loop with tools + per-thread state fits LangGraph's graph/state model |
| 3 | Model | Claude Sonnet 5 | Best quality/latency balance for real-time WhatsApp chat |
| 4 | Twilio webhook location | Agent service `POST /webhook/whatsapp` (moved from Next.js) | Centralizes all Twilio I/O in the agent service |
| 5 | Outbound trigger | Next.js does matching, calls agent `/notify` | Matching stays in the app (`matching.ts`); agent owns Twilio send |
| 6 | Hosting | Cloud Run, `min-instances=1` | Avoids cold-start latency at the live-demo wow moment |
| 7 | Agent v1 scope | Gig Q&A + accept/decline ONLY | "Other gigs" browsing + availability changes over WhatsApp deferred |
| 8 | Agent construction | `create_react_agent` + Postgres checkpointer | Scoped stateful tool-chat; checkpointer keyed by `thread_key` gives per-thread memory for free (no Deep Agents needed) |
| 9 | Thread routing | One `active` `whatsapp_threads` row per phone; newest-notification-wins | Deterministic inbound resolution from phone-only Twilio payload; multi-gig disambiguation deferred |
| 10 | Tool IDs | Injected by handler, never LLM-emitted | Guarantees the LLM cannot fabricate `job_id`/`candidate_profile_id` |
| 11 | Scale-up path | LangChain Deep Agents SDK for the future "career advisor" | Planning + subagent fleet + long-lived memory — not this scoped demo |

## Integration Points

### Upstream Systems
| System | Trigger / Interface | Data Provided |
|---|---|---|
| Next.js app | `POST /notify` (HTTP, shared-secret) | Gig object + matched candidate list |
| Twilio (chef reply) | `POST /webhook/whatsapp` (Twilio HTTP webhook) | Inbound WhatsApp message (From, Body) |

### Downstream Systems
| System | Interface | Data Consumed |
|---|---|---|
| Supabase | DB write (service-role) | `applications` row (accept/decline), `whatsapp_messages` log |
| Twilio | REST API | Outbound WhatsApp messages |
| Next.js dashboard | via Supabase Realtime/poll | Reads the acceptance the agent wrote |

### External Services
| Service | Used By | Purpose | Auth |
|---|---|---|---|
| Twilio WhatsApp (sandbox) | agent service | Inbound webhook + outbound send | Account SID + Auth Token |
| Anthropic API | LangGraph agent | Claude Sonnet 5 | API key |
| Supabase | agent service | Read gig/candidate, write application/log | Service-role key (server-side only) |

## Shared Infrastructure

### LLM Strategy
| Model | Provider | Used For | Reasoning |
|---|---|---|---|
| claude-sonnet-5 | anthropic | The single conversational agent | Fast + capable enough for scoped gig chat; latency matters for live demo |

## Endpoint Contracts

### Endpoints Summary
| Endpoint | Method | Input | Output | Handles |
|---|---|---|---|---|
| `/notify` | POST | `NotifyRequest` (gig + candidates) | `NotifyResponse` (sent/pending) | outbound send + thread create |
| `/webhook/whatsapp` | POST | Twilio form (From, Body) | 200 (ack); reply sent via Twilio REST | inbound → resolve thread → agent → reply |
| `/health` | GET | — | `{status: ok}` | keep-warm / readiness |

## System Constraints

### Non-Functional Requirements
| Requirement | Value | Notes |
|---|---|---|
| Interaction mode | User-facing (chef via WhatsApp) | Hospitality voice; concise mobile-friendly replies |
| Error tolerance | Best-effort | Graceful fallback; blocked sends → "notification pending", never crash |
| Latency | Real-time | Sonnet 5 + Cloud Run min-inst=1; reply target a few seconds |
| Scale | Demo (handful concurrent) | Not production volume |
| Cost | Prototype | Sonnet 5; single agent |

## Reading Guide

### For Implementation (impl-builder reading order)
1. **This document** (`overview.md`) — context, architecture, decisions
2. **`manifest.yaml`** — hierarchy, files, execution plan
3. **`whatsapp-gig-agent.md`** — the agent spec (tools, prompt, I/O, edge cases, run-book)
4. **`agent-config.yaml`** — machine-readable agent config
5. Cross-reference **`../spec.md`** for the app-side contracts (matching, `applications` schema, dashboard reflection)

### File Map
| File | Purpose |
|---|---|
| `overview.md` | System context and architecture (this file) |
| `manifest.yaml` | Machine-readable hierarchy + execution plan |
| `whatsapp-gig-agent.md` | The agent spec |
| `agent-config.yaml` | Agent configuration |
