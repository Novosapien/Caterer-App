import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { CandidateProfile, Job, CvRating } from "./types";
import { formatPay } from "./format";

// AI "Rate my CV" — scores a chef's profile/CV against a specific job spec (1-100)
// with strengths, gaps and concrete recommendations. Uses Claude with a forced tool
// call so the result is always structured. SERVER ONLY (holds the Anthropic key).

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

function candidateToCv(c: CandidateProfile): string {
  const lines: string[] = [];
  lines.push(`Name: ${c.profile?.name ?? "Unknown"}`);
  if (c.headline) lines.push(`Headline: ${c.headline}`);
  if (c.years_experience != null) lines.push(`Years of experience: ${c.years_experience}`);
  if (c.location_area) lines.push(`Based in: ${c.location_area}`);
  if (c.specialisms?.length) lines.push(`Specialisms: ${c.specialisms.join(", ")}`);
  if (c.cuisines?.length) lines.push(`Cuisines: ${c.cuisines.join(", ")}`);
  if (c.languages?.length) lines.push(`Languages: ${c.languages.join(", ")}`);
  if (c.certifications?.length) lines.push(`Certifications: ${c.certifications.join(", ")}`);
  if (c.work_pref) lines.push(`Work preference: ${c.work_pref}`);
  if (c.desired_roles?.length) lines.push(`Desired roles: ${c.desired_roles.join(", ")}`);
  if (c.desired_pay_aed != null)
    lines.push(`Target pay: ${formatPay(c.desired_pay_aed, c.desired_pay_unit ?? "shift")}`);
  if (c.bio) lines.push(`\nSummary:\n${c.bio}`);
  if (c.experience?.length) {
    lines.push("\nWork history:");
    for (const x of c.experience) {
      const period = [x.start_label, x.is_current ? "Present" : x.end_label]
        .filter(Boolean)
        .join(" to ");
      lines.push(`- ${x.title} at ${x.company}${period ? ` (${period})` : ""}`);
      if (x.description) lines.push(`  ${x.description}`);
    }
  }
  lines.push(`\nHas an uploaded CV document: ${c.cv_url ? "yes" : "no"}`);
  return lines.join("\n");
}

function jobToSpec(j: Job): string {
  const lines: string[] = [
    `Role: ${j.title}`,
    `Role type: ${j.role_type}`,
    `Venue: ${j.venue}`,
    `Area: ${j.location_area}`,
    `Pay: ${formatPay(j.pay_aed, j.pay_unit)}`,
    `Urgent: ${j.is_urgent ? "yes" : "no"}`,
    `Temp/shift: ${j.is_temp ? "yes" : "no"}`,
  ];
  if (j.dress_code) lines.push(`Dress code: ${j.dress_code}`);
  if (j.description) lines.push(`\nDescription:\n${j.description}`);
  return lines.join("\n");
}

const SYSTEM = [
  "You are an expert hospitality and catering recruiter in Dubai.",
  "You assess how well a chef's/crew member's CV fits a specific job.",
  "Be honest, specific and constructive. Judge fit for THIS role only, using the CV and the job spec.",
  "Weigh: relevant role/section experience, seniority match, cuisine/venue fit, certifications,",
  "availability/temp suitability, and location. A pristine CV for the wrong role should not score high.",
  "Scores: 85-100 excellent fit, 70-84 strong, 55-69 moderate, 40-54 weak, below 40 poor.",
  "Recommendations must be concrete, CV-specific edits (not generic advice).",
  "Keep every bullet to one crisp sentence. Do not use em dashes.",
].join(" ");

const TOOL: Anthropic.Tool = {
  name: "submit_cv_rating",
  description: "Return the structured CV-to-job fit rating.",
  input_schema: {
    type: "object",
    properties: {
      score: { type: "integer", minimum: 1, maximum: 100, description: "Overall fit score for this role" },
      verdict: { type: "string", description: "A 2-5 word overall verdict, e.g. 'Strong fit'" },
      summary: { type: "string", description: "2-3 sentences explaining why this is a good or bad fit" },
      strengths: {
        type: "array",
        items: { type: "string" },
        description: "3-5 specific strengths matching this CV to this role",
      },
      gaps: {
        type: "array",
        items: { type: "string" },
        description: "2-4 gaps or weaknesses for this specific role",
      },
      recommendations: {
        type: "array",
        items: { type: "string" },
        description: "3-5 concrete edits to the CV that would improve fit for this role",
      },
    },
    required: ["score", "verdict", "summary", "strengths", "gaps", "recommendations"],
  },
};

export async function reviewCvForJob(candidate: CandidateProfile, job: Job): Promise<CvRating> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1400,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "submit_cv_rating" },
    messages: [
      {
        role: "user",
        content: `Rate this candidate's fit for the job below.\n\n=== JOB SPEC ===\n${jobToSpec(
          job,
        )}\n\n=== CANDIDATE CV ===\n${candidateToCv(candidate)}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("The model did not return a structured rating.");
  }
  const raw = block.input as Partial<CvRating>;
  // Clamp + defensively default so the UI never breaks on a malformed field.
  const score = Math.max(1, Math.min(100, Math.round(Number(raw.score) || 0)));
  return {
    score,
    verdict: raw.verdict?.trim() || "Assessed",
    summary: raw.summary?.trim() || "",
    strengths: Array.isArray(raw.strengths) ? raw.strengths.filter(Boolean) : [],
    gaps: Array.isArray(raw.gaps) ? raw.gaps.filter(Boolean) : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.filter(Boolean) : [],
  };
}
