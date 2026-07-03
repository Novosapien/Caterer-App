# Caterer Dubai — MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets Claude
(Claude Desktop or Claude Code) act on the Caterer Dubai platform: search gigs, apply,
and manage a chef's profile and CV. It talks to the same Supabase backend as the web app.

## Tools

| Tool | What it does |
|------|--------------|
| `search_jobs` | Search open gigs by keyword, area, or urgency. Returns a list with `job_id`s. |
| `get_job` | Full detail of one gig (pay, venue, time, dress code, description). |
| `apply_to_job` | Apply to a gig as the current chef (recruiter dashboard sees it). |
| `list_my_applications` | The chef's applications and their status. |
| `get_my_profile` | Name, headline, bio, availability, target pay, CV link, work history. |
| `update_my_profile` | Update headline, bio, availability, target pay, work preference, name. |
| `set_cv` | Attach or replace the chef's CV by URL. |
| `add_experience` | Add a role to the chef's CV / work history. |

## Identity

The server acts as one chef, set by `CATERER_PROFILE_ID` (a `profiles.id`). It defaults
to the demo chef, Yusuf Rahman (`11111111-1111-1111-1111-111111111111`). Run separate
instances with different IDs to act as different chefs.

## Setup

```bash
cd caterer-mcp
npm install
npm run build
cp .env.example .env   # then fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS, so this is a trusted local process (same
trust model as the app's server actions). Keep `.env` out of version control (it is
gitignored). The server loads `.env` from its own folder, so you never need to put the
key in your Claude config.

Smoke-test it:

```bash
node scripts/smoke.mjs
```

## Use from Claude Code (CLI)

```bash
claude mcp add caterer-dubai -- node "/Users/MaxKingaby/Programming/Total Jobs/caterer-mcp/dist/index.js"
```

Then in a Claude Code session: "search catering gigs in Palm Jumeirah", "apply to job
&lt;id&gt;", "attach my CV at https://…", etc.

## Use from Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "caterer-dubai": {
      "command": "node",
      "args": ["/Users/MaxKingaby/Programming/Total Jobs/caterer-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The Caterer tools appear in the tools menu.

## Dev

- `npm run dev` runs the TypeScript entry directly (tsx), no build step.
- `npm run inspect` opens the MCP Inspector against the built server.
- Never write to stdout in the server: that channel is the MCP protocol. Logs go to stderr.
