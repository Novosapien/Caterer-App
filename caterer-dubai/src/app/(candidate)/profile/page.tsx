import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import DescriptionIcon from "@mui/icons-material/Description";
import StarIcon from "@mui/icons-material/Star";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmptyState from "@/components/EmptyState";
import { loginAsChef } from "@/app/actions/auth";
import { getSession } from "@/lib/session";
import { getCandidate, getCandidateInsights } from "@/lib/queries";
import { getProfileSections } from "@/components/candidate/profileSections";
import { brand } from "@/theme/brand";

// Dark, premium palette for the candidate profile — near-black page, lifted cards.
const PAGE = "#0E0E10";
const CARD = "#1A1A1C";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.60)";
const HAIRLINE = "rgba(255,255,255,0.10)";
const AVAIL_GREEN = "#34D171";

const cardSx = {
  bgcolor: CARD,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 4,
  p: { xs: 2.25, md: 2.75 },
};

// Candidate's own profile (R3), fully designed dark view. Edit lives at /profile/edit.
export default async function ProfilePage() {
  const session = await getSession();
  const candidate =
    session?.role === "candidate" ? await getCandidate(session.profileId) : null;

  if (!candidate) {
    const isRecruiter = session?.role === "recruiter";
    return (
      <Container maxWidth="sm" sx={{ pt: 4 }}>
        <EmptyState
          icon={<PersonOutlineIcon fontSize="inherit" />}
          title="No profile yet"
          subtitle={
            isRecruiter
              ? "You're currently previewing as a recruiter. Switch to the demo chef to see the chef profile."
              : "Preview the demo chef, or browse gigs and apply to any one. We'll set up your profile in 20 seconds, then you can build it out here."
          }
        />
        <Stack spacing={1.25} sx={{ alignItems: "center" }}>
          <form action={loginAsChef}>
            <Button type="submit" variant="contained" size="large">
              View as demo chef (Max)
            </Button>
          </form>
          <Button component="a" href="/jobs" variant="text" color="inherit">
            Browse gigs
          </Button>
        </Stack>
      </Container>
    );
  }

  const name = candidate.profile?.name ?? "Your profile";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const sections = getProfileSections(candidate);

  const role = candidate.specialisms?.[0] ?? candidate.desired_roles?.[0] ?? "Catering professional";
  const segment = candidate.cuisines[0] ?? candidate.specialisms[1] ?? null;

  // Real engagement metrics, shown as one quiet inline row (private to the candidate).
  const insights = await getCandidateInsights(session!.profileId);
  const metrics = [
    { n: insights.profileViews, label: "profile views" },
    { n: insights.applications, label: "applications" },
    { n: insights.gigsWon, label: "gigs won" },
  ];

  const shortWp =
    candidate.work_pref === "shift"
      ? "Temp / shift work"
      : candidate.work_pref === "permanent"
        ? "Full-time"
        : candidate.work_pref === "both"
          ? "Shift or full-time"
          : null;
  const openTo = [candidate.open_to_urgent ? "Urgent gigs" : null, shortWp].filter(Boolean) as string[];

  return (
    <Box sx={{ bgcolor: PAGE, color: "#fff", minHeight: "100dvh" }}>
      <Container maxWidth="sm" sx={{ pt: 1.5, pb: 13 }}>
        {/* Slim toolbar — back to the feed */}
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", py: 1 }}>
          <Button
            component="a"
            href="/jobs"
            startIcon={<ArrowBackIcon />}
            sx={{ color: MUTED, fontWeight: 600, px: 1, "&:hover": { color: "#fff", bgcolor: "transparent" } }}
          >
            Gigs
          </Button>
        </Stack>

        {/* Header — restrained identity, one accent, no chrome */}
        <Box sx={{ ...cardSx, mb: 2 }}>
          <Stack direction="row" spacing={{ xs: 2, sm: 2.5 }} sx={{ alignItems: "flex-start" }}>
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Avatar
                src={candidate.profile?.avatar_url ?? undefined}
                sx={{
                  width: { xs: 74, sm: 88 },
                  height: { xs: 74, sm: 88 },
                  background: brand.navySheen,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "2rem",
                  border: `1px solid ${HAIRLINE}`,
                }}
              >
                {initial}
              </Avatar>
              {candidate.available && (
                <Box
                  sx={{
                    position: "absolute",
                    right: 2,
                    bottom: 2,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    bgcolor: AVAIL_GREEN,
                    border: `2.5px solid ${CARD}`,
                  }}
                />
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, lineHeight: 1.04, fontSize: { xs: "1.95rem", sm: "2.35rem" }, letterSpacing: "-0.015em" }}>
                    {name}
                  </Typography>
                  <Typography sx={{ mt: 0.25, color: "rgba(255,255,255,0.7)", fontWeight: 500, fontSize: "1rem" }}>
                    {[role, segment].filter(Boolean).join(", ")}
                  </Typography>
                </Box>
                <Button
                  component="a"
                  href="/profile/edit"
                  variant="text"
                  startIcon={<EditIcon sx={{ fontSize: "1.05rem" }} />}
                  sx={{
                    flexShrink: 0,
                    color: brand.tealBright,
                    fontWeight: 700,
                    px: 1,
                    minWidth: 0,
                    "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                  }}
                >
                  Edit
                </Button>
              </Stack>

              {(candidate.location_area || candidate.years_experience != null) && (
                <Typography variant="body2" sx={{ mt: 1, color: MUTED }}>
                  {[
                    candidate.location_area,
                    candidate.years_experience != null ? `${candidate.years_experience} yrs experience` : null,
                  ]
                    .filter(Boolean)
                    .join("   ·   ")}
                </Typography>
              )}

              <Stack direction="row" spacing={2} sx={{ mt: 1, alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: candidate.available ? AVAIL_GREEN : MUTED }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: candidate.available ? "#fff" : MUTED }}>
                    {candidate.available ? "Available now" : "Not available"}
                  </Typography>
                </Stack>
                {(candidate.rating_count ?? 0) > 0 && (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <StarIcon sx={{ fontSize: "1rem", color: brand.teal }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{candidate.rating_avg?.toFixed(1)}</Typography>
                    <Typography variant="body2" sx={{ color: MUTED }}>
                      · {candidate.rating_count} review{candidate.rating_count === 1 ? "" : "s"}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>

          {/* Quiet metrics row — real engagement, private to you */}
          <Stack direction="row" spacing={2.5} sx={{ mt: 2.5, flexWrap: "wrap", rowGap: 0.5 }}>
            {metrics.map((m) => (
              <Typography key={m.label} variant="body2" sx={{ color: MUTED }}>
                <Box component="span" sx={{ color: "#fff", fontWeight: 800 }}>{m.n}</Box> {m.label}
              </Typography>
            ))}
          </Stack>

          {openTo.length > 0 && (
            <>
              <Divider sx={{ my: 2, borderColor: HAIRLINE }} />
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}>
                <Typography variant="body2" sx={{ color: MUTED, fontWeight: 600, mr: 0.5 }}>Open to</Typography>
                {openTo.map((o) => (
                  <Box
                    key={o}
                    sx={{
                      px: 1.25,
                      py: 0.4,
                      borderRadius: "8px",
                      border: `1px solid ${HAIRLINE}`,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {o}
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Box>

        {/* Compact section hub — each card opens its own detail page */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
          {sections.map((s) => (
            <Box
              key={s.key}
              component="a"
              href={`/profile/${s.key}`}
              sx={{
                textDecoration: "none",
                ...cardSx,
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                transition: "border-color 120ms, background-color 120ms",
                "&:hover": { borderColor: "rgba(255,255,255,0.22)", bgcolor: "#1E1E22" },
              }}
            >
              <Box sx={{ color: MUTED, display: "inline-flex", flexShrink: 0 }}>{s.icon}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff", lineHeight: 1.2 }}>
                  {s.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: MUTED, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {s.preview}
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ color: MUTED, fontSize: "1.2rem", flexShrink: 0 }} />
            </Box>
          ))}
        </Box>
      </Container>

      {/* Sticky action bar */}
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          bgcolor: "rgba(14,14,16,0.86)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        <Container maxWidth="sm" sx={{ py: 1.5 }}>
          <Stack direction="row" spacing={1.5}>
            <Button
              component="a"
              href={candidate.cv_url ?? "/profile/edit"}
              target={candidate.cv_url ? "_blank" : undefined}
              startIcon={<DescriptionIcon />}
              sx={{
                flex: 1,
                py: 1.25,
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.06)",
                border: `1px solid ${HAIRLINE}`,
                fontWeight: 700,
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              {candidate.cv_url ? "View CV" : "Add CV"}
            </Button>
            <Button
              component="a"
              href="/profile/edit"
              variant="contained"
              color="teal"
              startIcon={<EditIcon />}
              sx={{ flex: 1.6, py: 1.25, fontWeight: 700 }}
            >
              Edit profile
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

