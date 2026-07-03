import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
// Load caterer-mcp/.env regardless of the process cwd (Claude spawns us from anywhere).
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { db, PROFILE_ID } from "./supabase.js";
import { jobLine, jobDetail, payLine } from "./format.js";

const server = new McpServer({ name: "caterer-dubai", version: "1.0.0" });

// --- helpers -----------------------------------------------------------------
type Result = { content: { type: "text"; text: string }[]; isError?: boolean };
const ok = (text: string): Result => ({ content: [{ type: "text", text }] });
const fail = (text: string): Result => ({ content: [{ type: "text", text }], isError: true });

// --- gigs --------------------------------------------------------------------
server.registerTool(
  "search_jobs",
  {
    title: "Search catering gigs",
    description:
      "Search open catering/hospitality gigs in Dubai. Filter by keyword, area, or urgency. Returns a list with job_id for each gig.",
    inputSchema: {
      query: z.string().optional().describe("Keyword matched across title, venue, area and role type"),
      area: z.string().optional().describe("Filter by location area, e.g. 'Palm Jumeirah'"),
      urgent_only: z.boolean().optional().describe("Only return urgent gigs"),
      limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)"),
    },
  },
  async ({ query, area, urgent_only, limit }) => {
    let q = db().from("jobs").select("*, business:businesses(name)").eq("status", "open");
    if (urgent_only) q = q.eq("is_urgent", true);
    q = q.order("is_urgent", { ascending: false }).order("start_at", { ascending: true });
    const { data, error } = await q;
    if (error) return fail(`Could not search gigs: ${error.message}`);

    let jobs = data ?? [];
    if (query?.trim()) {
      const s = query.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(s) ||
          j.venue?.toLowerCase().includes(s) ||
          j.location_area?.toLowerCase().includes(s) ||
          j.role_type?.toLowerCase().includes(s),
      );
    }
    if (area?.trim()) {
      const a = area.toLowerCase();
      jobs = jobs.filter((j) => j.location_area?.toLowerCase().includes(a));
    }
    jobs = jobs.slice(0, limit ?? 20);

    if (jobs.length === 0) return ok("No open gigs match those filters.");
    const header = `${jobs.length} open gig${jobs.length === 1 ? "" : "s"}:\n`;
    return ok(header + "\n" + jobs.map(jobLine).join("\n\n"));
  },
);

server.registerTool(
  "get_job",
  {
    title: "Get gig details",
    description: "Get the full details of a single gig by its job_id (pay, venue, time, dress code, description).",
    inputSchema: { job_id: z.string().describe("The gig's job_id") },
  },
  async ({ job_id }) => {
    const { data, error } = await db()
      .from("jobs")
      .select("*, business:businesses(name)")
      .eq("id", job_id)
      .maybeSingle();
    if (error) return fail(`Could not load gig: ${error.message}`);
    if (!data) return fail(`No gig found with job_id ${job_id}.`);
    return ok(jobDetail(data));
  },
);

server.registerTool(
  "apply_to_job",
  {
    title: "Apply to a gig",
    description: "Apply to a gig as the current chef. Records an application (status=applied) the recruiter dashboard will see.",
    inputSchema: { job_id: z.string().describe("The gig's job_id to apply to") },
  },
  async ({ job_id }) => {
    const { data: job, error: jErr } = await db()
      .from("jobs")
      .select("id, title, venue")
      .eq("id", job_id)
      .maybeSingle();
    if (jErr) return fail(`Could not check the gig: ${jErr.message}`);
    if (!job) return fail(`No gig found with job_id ${job_id}.`);

    const { error } = await db()
      .from("applications")
      .upsert(
        {
          job_id,
          candidate_profile_id: PROFILE_ID,
          status: "applied",
          source: "app",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "job_id,candidate_profile_id" },
      );
    if (error) return fail(`Could not apply: ${error.message}`);
    return ok(`Applied to "${job.title}" at ${job.venue}. The recruiter will see your application.`);
  },
);

server.registerTool(
  "list_my_applications",
  {
    title: "List my applications",
    description: "List the gigs the current chef has applied to, with their status.",
    inputSchema: {},
  },
  async () => {
    const { data, error } = await db()
      .from("applications")
      .select("status, source, updated_at, job:jobs(title, venue, location_area, start_at)")
      .eq("candidate_profile_id", PROFILE_ID)
      .order("updated_at", { ascending: false });
    if (error) return fail(`Could not load applications: ${error.message}`);
    if (!data || data.length === 0) return ok("You have not applied to any gigs yet.");

    const lines = data.map((a) => {
      const job = (a.job ?? {}) as { title?: string; venue?: string };
      return `• ${job.title ?? "Gig"} · ${job.venue ?? ""} — status: ${a.status} (via ${a.source})`;
    });
    return ok(`${data.length} application${data.length === 1 ? "" : "s"}:\n\n` + lines.join("\n"));
  },
);

// --- profile / CV ------------------------------------------------------------
server.registerTool(
  "get_my_profile",
  {
    title: "Get my profile",
    description: "Show the current chef's profile: name, headline, bio, availability, target pay, CV link and work history.",
    inputSchema: {},
  },
  async () => {
    const { data, error } = await db()
      .from("candidate_profiles")
      .select("*, profile:profiles(name, phone)")
      .eq("profile_id", PROFILE_ID)
      .maybeSingle();
    if (error) return fail(`Could not load profile: ${error.message}`);
    if (!data) return fail("No chef profile found for this session.");

    const p = (data.profile ?? {}) as { name?: string; phone?: string };
    const lines = [
      `Name: ${p.name ?? "(unset)"}`,
      `Headline: ${data.headline ?? "(unset)"}`,
      `Location: ${data.location_area ?? "(unset)"}`,
      `Available now: ${data.available ? "yes" : "no"}`,
      `Open to urgent: ${data.open_to_urgent ? "yes" : "no"}`,
      data.years_experience != null ? `Experience: ${data.years_experience} yrs` : null,
      data.desired_pay_aed != null
        ? `Target pay: ${payLine(data.desired_pay_aed, data.desired_pay_unit ?? "shift")}`
        : null,
      `CV: ${data.cv_url ?? "(none attached)"}`,
      data.bio ? `\nBio:\n${data.bio}` : null,
    ].filter(Boolean);

    const exp = await db()
      .from("candidate_experience")
      .select("title, company, start_label, end_label, is_current")
      .eq("profile_id", PROFILE_ID)
      .order("is_current", { ascending: false })
      .order("sort_order", { ascending: true });
    if (exp.data && exp.data.length > 0) {
      lines.push("\nExperience:");
      for (const x of exp.data) {
        const period = [x.start_label, x.is_current ? "Present" : x.end_label].filter(Boolean).join(" – ");
        lines.push(`• ${x.title} · ${x.company}${period ? ` (${period})` : ""}`);
      }
    }
    return ok(lines.join("\n"));
  },
);

server.registerTool(
  "update_my_profile",
  {
    title: "Update my profile",
    description:
      "Update fields on the current chef's profile. Only provided fields change. Useful for headline, bio, availability and target pay.",
    inputSchema: {
      name: z.string().optional().describe("Display name"),
      headline: z.string().optional().describe("Short professional headline"),
      bio: z.string().optional().describe("Summary / about-me paragraph"),
      location_area: z.string().optional(),
      available: z.boolean().optional().describe("Available for work now"),
      open_to_urgent: z.boolean().optional().describe("Open to urgent same-day gigs"),
      years_experience: z.number().int().min(0).max(60).optional(),
      desired_pay_aed: z.number().int().min(0).optional().describe("Target pay in AED"),
      work_pref: z.enum(["shift", "permanent", "both"]).optional(),
    },
  },
  async (args) => {
    const { name, ...candidateFields } = args;

    if (name?.trim()) {
      const { error: nErr } = await db()
        .from("profiles")
        .update({ name: name.trim() })
        .eq("id", PROFILE_ID);
      if (nErr) return fail(`Could not update name: ${nErr.message}`);
    }

    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(candidateFields)) {
      if (v !== undefined) patch[k] = v;
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await db()
        .from("candidate_profiles")
        .update(patch)
        .eq("profile_id", PROFILE_ID);
      if (error) return fail(`Could not update profile: ${error.message}`);
    }

    const changed = [name?.trim() ? "name" : null, ...Object.keys(patch)].filter(Boolean);
    if (changed.length === 0) return ok("Nothing to update — no fields were provided.");
    return ok(`Updated: ${changed.join(", ")}.`);
  },
);

server.registerTool(
  "set_cv",
  {
    title: "Attach a CV",
    description: "Attach (or replace) the current chef's CV by URL. The link shows on their profile and to recruiters.",
    inputSchema: {
      cv_url: z.string().url().describe("Public URL to the CV (PDF or doc)"),
    },
  },
  async ({ cv_url }) => {
    const { error } = await db()
      .from("candidate_profiles")
      .update({ cv_url })
      .eq("profile_id", PROFILE_ID);
    if (error) return fail(`Could not attach CV: ${error.message}`);
    return ok(`CV attached: ${cv_url}`);
  },
);

server.registerTool(
  "add_experience",
  {
    title: "Add a work-history entry",
    description: "Add a role to the current chef's CV / work history (title, company, dates, description).",
    inputSchema: {
      title: z.string().describe("Role title, e.g. 'Chef de Partie'"),
      company: z.string().describe("Employer / venue"),
      location: z.string().optional(),
      start_label: z.string().optional().describe("e.g. 'Mar 2021'"),
      end_label: z.string().optional().describe("e.g. 'Present' or 'Nov 2023'"),
      is_current: z.boolean().optional().describe("Is this the current role?"),
      description: z.string().optional(),
    },
  },
  async (args) => {
    const { count } = await db()
      .from("candidate_experience")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", PROFILE_ID);

    const { error } = await db().from("candidate_experience").insert({
      profile_id: PROFILE_ID,
      title: args.title,
      company: args.company,
      location: args.location ?? null,
      start_label: args.start_label ?? null,
      end_label: args.is_current ? null : args.end_label ?? null,
      is_current: args.is_current ?? false,
      description: args.description ?? null,
      sort_order: count ?? 0,
    });
    if (error) return fail(`Could not add experience: ${error.message}`);
    return ok(`Added "${args.title}" at ${args.company} to your work history.`);
  },
);

// --- boot --------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Never write to stdout — that channel is the MCP protocol. Log to stderr.
  console.error("caterer-dubai MCP server running (stdio).");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
