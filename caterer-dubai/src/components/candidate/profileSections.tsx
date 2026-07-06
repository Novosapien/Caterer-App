import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Rating from "@mui/material/Rating";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import TranslateIcon from "@mui/icons-material/Translate";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import StarIcon from "@mui/icons-material/Star";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { brand } from "@/theme/brand";
import { formatPay } from "@/lib/format";
import type { CandidateProfile, WorkPref } from "@/lib/types";

// Shared dark tokens (kept local so the profile page and the per-section detail
// pages render identically).
export const MUTED = "rgba(255,255,255,0.60)";
export const HAIRLINE = "rgba(255,255,255,0.10)";
export const CARD = "#1A1A1C";
export const CARD_BORDER = "rgba(255,255,255,0.08)";
export const cardSx = {
  bgcolor: CARD,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 4,
  p: { xs: 2.25, md: 2.75 },
};

const ratingSx = {
  color: brand.teal,
  "& .MuiRating-iconEmpty": { color: "rgba(239,125,0,0.28)" },
};

function workPrefLabel(w: WorkPref | null | undefined): string | null {
  if (w === "shift") return "Open to temp / shift work";
  if (w === "permanent") return "Looking for full-time / permanent";
  if (w === "both") return "Open to shift or full-time";
  return null;
}

// "a, b +N" — a compact preview of a list for the summary cards.
function summarise(items: string[], max = 2): string {
  if (items.length === 0) return "";
  const head = items.slice(0, max).join(", ");
  const extra = items.length - max;
  return extra > 0 ? `${head} +${extra}` : head;
}

export function SectionTitle({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.75 }}>
      {icon && <Box sx={{ color: MUTED, display: "inline-flex", flexShrink: 0 }}>{icon}</Box>}
      <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff" }}>{title}</Typography>
    </Stack>
  );
}

function LabelledValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: MUTED }}>{label}</Typography>
      <Box sx={{ mt: 0.75 }}>{children}</Box>
    </Box>
  );
}

function ChipRow({ items }: { items: string[] }) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
      {items.map((i, idx) => (
        <Chip
          key={`${i}-${idx}`}
          label={i}
          sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.88)", border: `1px solid ${HAIRLINE}`, fontWeight: 600 }}
        />
      ))}
    </Stack>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 2, rowGap: 1.25 }}>
      {items.map((i, idx) => (
        <Stack key={`${i}-${idx}`} direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <CheckCircleIcon sx={{ color: brand.teal, fontSize: "1.15rem", flexShrink: 0 }} />
          <Typography sx={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{i}</Typography>
        </Stack>
      ))}
    </Box>
  );
}

// --- Section content renderers (the "greater information" shown on detail pages) ---

function AboutContent({ candidate }: { candidate: CandidateProfile }) {
  return (
    <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.7, color: "rgba(255,255,255,0.86)" }}>
      {candidate.bio}
    </Typography>
  );
}

function ExperienceContent({ candidate }: { candidate: CandidateProfile }) {
  const items = candidate.experience ?? [];
  return (
    <Stack spacing={0}>
      {items.map((x, i) => (
        <Stack
          key={x.id}
          direction="row"
          spacing={2}
          sx={{ pt: i === 0 ? 0 : 2, pb: i === items.length - 1 ? 0 : 2, borderTop: i === 0 ? "none" : `1px solid ${HAIRLINE}` }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: "10px",
              bgcolor: "rgba(255,255,255,0.06)",
              border: `1px solid ${HAIRLINE}`,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 700,
              fontSize: "1.05rem",
            }}
          >
            {(x.company?.trim().charAt(0) || "?").toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.25 }}>{x.title}</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>{x.company}</Typography>
            {(x.start_label || x.end_label || x.is_current || x.location) && (
              <Typography variant="caption" sx={{ color: MUTED }}>
                {[
                  [x.start_label, x.is_current ? "Present" : x.end_label].filter(Boolean).join(" - "),
                  x.location,
                ]
                  .filter(Boolean)
                  .join("  ·  ")}
              </Typography>
            )}
            {x.description && (
              <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.55, color: "rgba(255,255,255,0.75)" }}>
                {x.description}
              </Typography>
            )}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

function SkillsContent({ candidate }: { candidate: CandidateProfile }) {
  return (
    <Stack spacing={2}>
      {candidate.cuisines.length > 0 && (
        <LabelledValue label="Cuisine"><ChipRow items={candidate.cuisines} /></LabelledValue>
      )}
      {candidate.specialisms.length > 0 && (
        <LabelledValue label="What I do best"><CheckList items={candidate.specialisms} /></LabelledValue>
      )}
      {candidate.interests.length > 0 && (
        <LabelledValue label="Also interested in"><ChipRow items={candidate.interests} /></LabelledValue>
      )}
    </Stack>
  );
}

function LanguagesContent({ candidate }: { candidate: CandidateProfile }) {
  return <ChipRow items={candidate.languages} />;
}

function LookingForContent({ candidate }: { candidate: CandidateProfile }) {
  const wp = workPrefLabel(candidate.work_pref);
  return (
    <Stack spacing={1.75}>
      {wp && <LabelledValue label="Work type"><Typography sx={{ fontWeight: 700 }}>{wp}</Typography></LabelledValue>}
      {candidate.desired_roles.length > 0 && (
        <LabelledValue label="Roles"><ChipRow items={candidate.desired_roles} /></LabelledValue>
      )}
      {candidate.desired_areas.length > 0 && (
        <LabelledValue label="Preferred areas"><ChipRow items={candidate.desired_areas} /></LabelledValue>
      )}
      {candidate.desired_pay_aed != null && (
        <LabelledValue label="Target rate">
          <Typography sx={{ fontWeight: 800, color: brand.pay }}>
            {formatPay(candidate.desired_pay_aed, candidate.desired_pay_unit ?? "shift")}
          </Typography>
        </LabelledValue>
      )}
    </Stack>
  );
}

function ReviewsContent({ candidate }: { candidate: CandidateProfile }) {
  const reviews = candidate.reviews ?? [];
  return (
    <Stack spacing={2}>
      {reviews.map((r, i) => (
        <Box key={r.id}>
          {i > 0 && <Divider sx={{ mb: 2, borderColor: HAIRLINE }} />}
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: "rgba(239,125,0,0.18)", color: brand.tealBright, fontWeight: 800, fontSize: "0.95rem" }}>
              {(r.author_name?.trim().charAt(0) || "?").toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontWeight: 700 }} noWrap>{r.author_name}</Typography>
                <Rating value={r.rating} readOnly size="small" sx={ratingSx} />
              </Stack>
              {r.author_role && <Typography variant="caption" sx={{ color: MUTED }}>{r.author_role}</Typography>}
              {r.body && <Typography variant="body2" sx={{ mt: 0.5, color: "rgba(255,255,255,0.86)" }}>{r.body}</Typography>}
            </Box>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function CertificationsContent({ candidate }: { candidate: CandidateProfile }) {
  return <ChipRow items={candidate.certifications} />;
}

export type ProfileSection = {
  key: string;
  title: string;
  icon: React.ReactNode;
  preview: string;
  content: React.ReactNode;
};

// Every section that has content, with a short preview for the summary card and
// the full content for the /profile/[section] detail page.
export function getProfileSections(candidate: CandidateProfile): ProfileSection[] {
  const wp = workPrefLabel(candidate.work_pref);
  const exp = candidate.experience ?? [];
  const reviews = candidate.reviews ?? [];

  const all: (ProfileSection | null)[] = [
    candidate.bio
      ? {
          key: "about",
          title: "About",
          icon: <PersonOutlineIcon sx={{ fontSize: "1.2rem" }} />,
          preview: candidate.bio.replace(/\s+/g, " ").trim().slice(0, 46) + (candidate.bio.length > 46 ? "…" : ""),
          content: <AboutContent candidate={candidate} />,
        }
      : null,
    exp.length > 0
      ? {
          key: "experience",
          title: "Experience",
          icon: <WorkOutlineIcon sx={{ fontSize: "1.2rem" }} />,
          preview: `${exp.length} ${exp.length === 1 ? "role" : "roles"}${exp[0]?.company ? ` · ${exp[0].company}` : ""}`,
          content: <ExperienceContent candidate={candidate} />,
        }
      : null,
    candidate.specialisms.length > 0 || candidate.cuisines.length > 0 || candidate.interests.length > 0
      ? {
          key: "skills",
          title: "Key skills",
          icon: <RestaurantIcon sx={{ fontSize: "1.2rem" }} />,
          preview: summarise([...candidate.specialisms, ...candidate.cuisines]),
          content: <SkillsContent candidate={candidate} />,
        }
      : null,
    candidate.languages.length > 0
      ? {
          key: "languages",
          title: "Languages",
          icon: <TranslateIcon sx={{ fontSize: "1.2rem" }} />,
          preview: summarise(candidate.languages, 3),
          content: <LanguagesContent candidate={candidate} />,
        }
      : null,
    candidate.desired_roles.length > 0 || candidate.desired_areas.length > 0 || candidate.desired_pay_aed != null || wp
      ? {
          key: "looking-for",
          title: "Looking for",
          icon: <TrackChangesOutlinedIcon sx={{ fontSize: "1.2rem" }} />,
          preview:
            [wp, candidate.desired_roles.length > 0 ? summarise(candidate.desired_roles) : null]
              .filter(Boolean)
              .join(" · ") || "Preferences set",
          content: <LookingForContent candidate={candidate} />,
        }
      : null,
    reviews.length > 0
      ? {
          key: "reviews",
          title: "Reviews",
          icon: <StarIcon sx={{ fontSize: "1.2rem" }} />,
          preview: `${candidate.rating_avg?.toFixed(1) ?? ""} · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`,
          content: <ReviewsContent candidate={candidate} />,
        }
      : null,
    candidate.certifications.length > 0
      ? {
          key: "certifications",
          title: "Certifications",
          icon: <WorkspacePremiumIcon sx={{ fontSize: "1.2rem" }} />,
          preview: summarise(candidate.certifications),
          content: <CertificationsContent candidate={candidate} />,
        }
      : null,
  ];

  return all.filter(Boolean) as ProfileSection[];
}
