import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedCv, ExtractedCvExperience } from "./types";

// CV field extraction — reads the actual uploaded CV (PDF or image) with Claude and
// returns structured fields mapped to the candidate_profiles schema. The PDF is sent
// straight to the model as a document block (no separate parser; scanned CVs work via
// vision). Forced tool call so the result is always structured. SERVER ONLY (holds key).

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const SYSTEM = [
  "You extract structured data from a hospitality worker's CV for a Dubai catering marketplace.",
  "Read the attached document and return the fields via the submit_cv_fields tool.",
  "Normalise roles to common hospitality titles where possible (Head Chef, Sous Chef, Chef de Partie,",
  "Commis Chef, Pastry Chef, Waiter, Head Waiter, Barista, Bartender, Kitchen Porter).",
  "Only include facts actually present in the CV. Never invent experience, certifications or languages.",
  "Omit a scalar field if it is not present; use an empty array for lists with nothing to report.",
  "Keep the bio and each role description to one or two crisp sentences. Do not use em dashes.",
].join(" ");

const TOOL: Anthropic.Tool = {
  name: "submit_cv_fields",
  description: "Return the structured fields extracted from the candidate's CV.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Full name of the candidate" },
      headline: {
        type: "string",
        description: "A short professional headline, e.g. 'Chef de Partie, 8 yrs fine dining'",
      },
      bio: {
        type: "string",
        description: "A 2-3 sentence professional summary written in the candidate's voice",
      },
      years_experience: {
        type: "integer",
        description: "Total years of professional experience, estimated from the work history",
      },
      specialisms: {
        type: "array",
        items: { type: "string" },
        description: "Kitchen/hospitality roles and sections, e.g. 'Chef de Partie', 'Pastry', 'Grill', 'Banqueting'",
      },
      cuisines: {
        type: "array",
        items: { type: "string" },
        description: "Cuisines the candidate has worked in, e.g. 'Italian', 'Japanese', 'Arabic'",
      },
      certifications: {
        type: "array",
        items: { type: "string" },
        description: "Certifications and qualifications, e.g. 'Food Hygiene Level 2', 'HACCP'",
      },
      languages: { type: "array", items: { type: "string" }, description: "Spoken languages" },
      desired_roles: {
        type: "array",
        items: { type: "string" },
        description: "Roles the candidate is likely seeking, inferred from their most recent/senior positions",
      },
      experience: {
        type: "array",
        description: "Work history, most recent first",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            company: { type: "string" },
            location: { type: "string" },
            start_label: { type: "string", description: "e.g. 'Jan 2020' or '2020'" },
            end_label: { type: "string", description: "e.g. 'Mar 2023'; omit if this is the current role" },
            is_current: { type: "boolean" },
            description: { type: "string", description: "One or two sentences on the role" },
          },
          required: ["title", "company", "is_current"],
        },
      },
    },
    required: ["specialisms", "cuisines", "certifications", "languages", "desired_roles", "experience"],
  },
};

const IMAGE_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type ImageMedia = (typeof IMAGE_MEDIA)[number];

const INSTRUCTION = "Extract this candidate's CV into the structured fields.";

// Build the message content for the CV bytes. PDFs and images go straight to Claude as
// document/image blocks; Word .docx is unzipped to plain text with mammoth first (Claude
// cannot read .docx natively). `filename` (the stored CV URL) disambiguates Word formats.
async function buildCvContent(
  bytes: Uint8Array,
  contentType: string,
  filename = "",
): Promise<Anthropic.ContentBlockParam[]> {
  const ct = (contentType || "").toLowerCase();
  const name = filename.toLowerCase();
  const isPdf = ct.includes("pdf") || name.endsWith(".pdf");
  const isImage = ct.startsWith("image/");
  const isDocx = ct.includes("wordprocessingml") || ct.includes("officedocument") || name.endsWith(".docx");
  const isLegacyDoc = !isDocx && (name.endsWith(".doc") || ct === "application/msword");

  if (isPdf) {
    const data = Buffer.from(bytes).toString("base64");
    return [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
      { type: "text", text: INSTRUCTION },
    ];
  }
  if (isImage) {
    const media: ImageMedia = (IMAGE_MEDIA as readonly string[]).includes(ct)
      ? (ct as ImageMedia)
      : "image/png";
    const data = Buffer.from(bytes).toString("base64");
    return [
      { type: "image", source: { type: "base64", media_type: media, data } },
      { type: "text", text: INSTRUCTION },
    ];
  }
  if (isDocx) {
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    const text = (value || "").trim();
    if (!text) throw new Error("That Word document appears to be empty.");
    return [{ type: "text", text: `CV content (from a Word document):\n\n${text}\n\n${INSTRUCTION}` }];
  }
  if (isLegacyDoc) {
    throw new Error("Legacy Word .doc isn't supported for autofill. Please upload a PDF or .docx.");
  }
  throw new Error("Unsupported CV type for extraction. Please upload a PDF, Word .docx, or an image.");
}

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

const arr = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim())
    : [];

export async function extractCvFields(
  bytes: Uint8Array,
  contentType: string,
  filename = "",
): Promise<ExtractedCv> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const client = new Anthropic({ apiKey });

  const content = await buildCvContent(bytes, contentType, filename);
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "submit_cv_fields" },
    messages: [{ role: "user", content }],
  });

  const block = message.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("The model did not return structured CV fields.");
  }
  const raw = block.input as Record<string, unknown>;

  const yearsRaw = raw.years_experience;
  const years =
    yearsRaw != null && yearsRaw !== "" && Number.isFinite(Number(yearsRaw))
      ? Math.max(0, Math.min(60, Math.round(Number(yearsRaw))))
      : null;

  const experience: ExtractedCvExperience[] = Array.isArray(raw.experience)
    ? (raw.experience as Record<string, unknown>[])
        .map((x) => ({
          title: str(x.title) ?? "",
          company: str(x.company) ?? "",
          location: str(x.location),
          start_label: str(x.start_label),
          end_label: str(x.end_label),
          is_current: Boolean(x.is_current),
          description: str(x.description),
        }))
        .filter((x) => x.title || x.company)
    : [];

  return {
    name: str(raw.name),
    headline: str(raw.headline),
    bio: str(raw.bio),
    years_experience: years,
    specialisms: arr(raw.specialisms),
    cuisines: arr(raw.cuisines),
    certifications: arr(raw.certifications),
    languages: arr(raw.languages),
    desired_roles: arr(raw.desired_roles),
    experience,
  };
}
