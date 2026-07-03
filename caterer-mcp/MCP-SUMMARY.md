# Caterer Dubai: MCP Server Summary

**To:** george.westbrook@novosapien.ai
**Subject:** Caterer Dubai prototype: the MCP server

Hi George,

Quick write-up of the Caterer MCP server built as part of the Caterer Dubai pitch prototype.

## What it is

A standalone Model Context Protocol (MCP) server that lets Claude (or any MCP client) act as a chef on the Caterer Dubai platform, directly from a conversation. It connects to the same Supabase database the web app uses, so every action Claude takes (applying to a gig, updating a CV, editing the profile) is live and immediately visible in the app and the recruiter dashboard.

In short: it makes the platform agent-ready. It is the headless companion to the web app and the WhatsApp agent.

## What it can do (8 tools)

| Tool | Purpose |
|------|---------|
| search_jobs | Search and browse open gigs (role, urgent, and other filters) |
| get_job | Full detail for a single gig |
| apply_to_job | Submit a real application (writes an applications row) |
| list_my_applications | List the chef's applications and their status |
| get_my_profile | Read the chef's profile |
| update_my_profile | Edit profile fields (name, availability, preferences) |
| set_cv | Attach or update the CV |
| add_experience | Add a work-history entry |

## How it is built

- SDK: the official @modelcontextprotocol/sdk (McpServer, registerTool, StdioServerTransport). ESM, compiled with tsc.
- Data layer: a Supabase service-role client, defaulted to the demo chef (Yusuf), so "my profile" and "my applications" resolve to a real person out of the box.
- Config: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and CATERER_PROFILE_ID via environment. Secrets stay server-side only, never exposed to any client.
- Verified end-to-end with a smoke test against the live database.

## Why it matters for the pitch

It shows the platform is not just a website: a chef can find work, apply, and manage their profile entirely through an AI assistant, and those actions flow straight into the same live system recruiters act on. That is a differentiator against traditional job boards.

Happy to demo it live.

Best,
Nova
