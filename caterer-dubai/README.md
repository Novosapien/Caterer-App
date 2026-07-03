# Caterer — Dubai (reimagined pitch prototype)

A mobile-first PWA marketplace for the Dubai catering world — chefs/waiters/crew on one side,
hotels/eventing companies/recruiters on the other. Built to walk Total Jobs through the whole
product, both sides, end-to-end. Simulated data throughout; the **WhatsApp agent** (a separate
service — see `../specs/2026-07-01-caterer-dubai-prototype/agent-spec/`) is the one genuinely-real
integration.

Stack: **Next.js 16** (App Router, Turbopack) · React 19 · **MUI v9** · **Supabase** (Postgres/Auth) ·
manual PWA. Spec: `../specs/2026-07-01-caterer-dubai-prototype/spec.md`.

---

## 1. Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
```

`.env.local`:
| Var | What |
|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |
| `AGENT_SERVICE_URL` | URL of the WhatsApp agent service (Cloud Run) — optional in dev |
| `NOTIFY_SHARED_SECRET` | must match the agent service's `X-Notify-Secret` |

### Database
In the Supabase SQL editor (or `psql`), run in order:
1. `supabase/migrations/0001_schema.sql`
2. `supabase/seed.sql`

Seeds ~18 Dubai gigs, 15 candidates (incl. the fixed **hero chef** Yusuf Rahman — available +
open-to-urgent, Palm Jumeirah), 3 packages, and the demo recruiter (Sofia @ Atlantis Events,
pre-loaded with a Caterer Pro package).

## 2. Run

```bash
npm run dev     # http://localhost:3000
npm run build   # production build (verifies types + prerender)
npm run lint
```

## 3. Deploy (Vercel)

Import the `caterer-dubai/` folder as a Vercel project (framework auto-detected as Next.js). Add the
five env vars above in Vercel → Settings → Environment Variables. No `vercel.json` needed.

---

## 4. Demo walkthrough (the pitch script)

1. **Landing** → premium, catering-branded. Tap **Browse gigs — no login needed**.
2. **Candidate (anonymous):** browse `/jobs` (urgent gigs flagged amber), open one, tap **Apply** →
   the inline "Apply in 20 seconds" panel (name + mobile → OTP) — no full-screen takeover.
   Or use **Enter as chef** on the landing to jump in as the seeded hero chef; visit **Profile** to
   show Availability + Open-to-urgent + interests.
3. **Recruiter:** landing → **Enter as recruiter** → dashboard. **Buy a package** (mock checkout) →
   **Post a gig**, flag it **URGENT** ("Chef de Partie, Atlantis, tonight").
4. **★ The hero moment:** posting the urgent gig matches available chefs and pings them on **real
   WhatsApp** via the agent service. The hero chef replies "I'm in" → the recruiter **dashboard
   reflects the acceptance live** (Supabase Realtime).
5. Back on the recruiter side: open **Applicants** → see the WhatsApp-sourced acceptance → open the
   candidate's **CV** (which fires a "recruiter viewed your profile" alert to the chef).

## 5. WhatsApp hero run-book (do BEFORE a live demo)

The WhatsApp agent is a separate service (`agent-spec/`). For the live ping to work:
1. **Deploy/run the agent service** and set this app's `AGENT_SERVICE_URL` + `NOTIFY_SHARED_SECRET`.
2. **Join the Twilio sandbox** from the hero chef's phone (send `join <sandbox-keyword>` to the
   sandbox number) — **required**, one-time per phone.
3. **Re-open the 24h window:** have that phone message the sandbox shortly before the demo (Twilio
   sandbox only allows freeform outbound within 24h of the recipient's last inbound).
4. Point the Twilio sandbox inbound webhook at the agent service's `/webhook/whatsapp`.
5. **Insurance:** keep a screen-recorded clip of the WhatsApp exchange in case of live network issues.

If the agent service is offline, urgent posting still runs matching and shows "WhatsApp pending" —
the rest of the demo is unaffected.

---

## Notes / demo fidelity
- **Auth** is a demo-grade cookie session (1-tap personas + phone-first apply with a demo OTP that
  accepts any 6-digit code) — not a full Supabase Auth phone provider. Matches the "clickable demo"
  bar; swap in real OTP later.
- **Payments** are a mock checkout (no processor). **Matching** is rules-based (no ML).
- Imagery is Unsplash stock. The Caterer wordmark is a placeholder derived from the TJ family (no
  Caterer brand asset exists yet).
