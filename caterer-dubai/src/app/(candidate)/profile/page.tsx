import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Rating from "@mui/material/Rating";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import PlaceIcon from "@mui/icons-material/Place";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EditIcon from "@mui/icons-material/EditOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LanguageIcon from "@mui/icons-material/Language";
import TranslateIcon from "@mui/icons-material/Translate";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import DescriptionIcon from "@mui/icons-material/Description";
import StarIcon from "@mui/icons-material/Star";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmptyState from "@/components/EmptyState";
import { loginAsChef } from "@/app/actions/auth";
import { getSession } from "@/lib/session";
import { getCandidate } from "@/lib/queries";
import { formatPay } from "@/lib/format";
import { brand } from "@/theme/brand";
import type { WorkPref } from "@/lib/types";

// Dark, premium palette for the candidate profile — near-black page, lifted cards.
const PAGE = "#0E0E10";
const CARD = "#1A1A1C";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.60)";
const HAIRLINE = "rgba(255,255,255,0.10)";
const AVAIL_GREEN = "#34D171";
const PREF_BLUE = "#8AB4FF";

const cardSx = {
  bgcolor: CARD,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 4,
  p: { xs: 2.25, md: 2.75 },
};

function workPrefLabel(w: WorkPref | null | undefined): string | null {
  if (w === "shift") return "Open to temp / shift work";
  if (w === "permanent") return "Looking for full-time / permanent";
  if (w === "both") return "Open to shift or full-time";
  return null;
}

// Orange stars, matching the design.
const ratingSx = {
  color: brand.teal,
  "& .MuiRating-iconEmpty": { color: "rgba(239,125,0,0.28)" },
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
              View as demo chef (Yusuf)
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
  const wp = workPrefLabel(candidate.work_pref);

  // Stat strip — derived from real profile data, not invented numbers.
  const stats = [
    candidate.years_experience != null && {
      icon: <WorkOutlineIcon />,
      value: `${candidate.years_experience}`,
      label: candidate.years_experience === 1 ? "Year experience" : "Years experience",
    },
    candidate.experience &&
      candidate.experience.length > 0 && {
        icon: <StorefrontIcon />,
        value: `${candidate.experience.length}`,
        label: candidate.experience.length === 1 ? "Venue worked" : "Venues worked",
      },
    candidate.cuisines.length > 0 && {
      icon: <RestaurantMenuIcon />,
      value: `${candidate.cuisines.length}`,
      label: candidate.cuisines.length === 1 ? "Cuisine" : "Cuisines",
    },
    candidate.languages.length > 0 && {
      icon: <LanguageIcon />,
      value: `${candidate.languages.length}`,
      label: candidate.languages.length === 1 ? "Language" : "Languages",
    },
  ].filter(Boolean) as { icon: React.ReactNode; value: string; label: string }[];

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

        {/* Header card — identity, rating, status chips */}
        <Box sx={{ ...cardSx, position: "relative", overflow: "hidden", mb: 2 }}>
          <Box
            sx={{
              position: "absolute",
              top: -70,
              right: -70,
              width: 240,
              height: 240,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(239,125,0,0.20) 0%, rgba(239,125,0,0) 70%)`,
              pointerEvents: "none",
            }}
          />

          <Stack direction="row" spacing={2} sx={{ position: "relative", alignItems: "flex-start" }}>
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <Avatar
                src={candidate.profile?.avatar_url ?? undefined}
                sx={{
                  width: 92,
                  height: 92,
                  background: brand.navySheen,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "2.1rem",
                  border: `2px solid ${HAIRLINE}`,
                }}
              >
                {initial}
              </Avatar>
              {candidate.available && (
                <Box
                  sx={{
                    position: "absolute",
                    right: 5,
                    bottom: 5,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: AVAIL_GREEN,
                    border: `3px solid ${CARD}`,
                    boxShadow: `0 0 10px ${AVAIL_GREEN}`,
                  }}
                />
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.12 }}>
                    {name}
                  </Typography>
                  <Typography sx={{ mt: 0.25, color: MUTED }}>
                    {candidate.headline ?? "Catering professional · Dubai"}
                  </Typography>
                </Box>
                <Button
                  component="a"
                  href="/profile/edit"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{
                    flexShrink: 0,
                    color: "#fff",
                    borderColor: HAIRLINE,
                    "&:hover": { borderColor: brand.teal, bgcolor: "rgba(239,125,0,0.08)" },
                  }}
                >
                  Edit profile
                </Button>
              </Stack>

              {(candidate.rating_count ?? 0) > 0 && (
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 1 }}>
                  <Rating value={candidate.rating_avg ?? 0} precision={0.5} readOnly size="small" sx={ratingSx} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {candidate.rating_avg?.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: MUTED }}>
                    ({candidate.rating_count} review{candidate.rating_count === 1 ? "" : "s"})
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          {/* Status chips */}
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1, position: "relative" }}>
            {candidate.location_area && (
              <Chip
                icon={<PlaceIcon sx={{ fontSize: "1rem !important", color: `${MUTED} !important` }} />}
                label={candidate.location_area}
                sx={{ fontWeight: 700, color: "#fff", bgcolor: "rgba(255,255,255,0.06)", border: `1px solid ${HAIRLINE}` }}
              />
            )}
            <Chip
              icon={
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: candidate.available ? AVAIL_GREEN : MUTED,
                    ml: "10px !important",
                  }}
                />
              }
              label={candidate.available ? "Available now" : "Not available"}
              sx={{
                fontWeight: 700,
                bgcolor: candidate.available ? "rgba(52,209,113,0.14)" : "rgba(255,255,255,0.06)",
                color: candidate.available ? AVAIL_GREEN : MUTED,
              }}
            />
            {candidate.open_to_urgent && (
              <Chip
                icon={<BoltIcon sx={{ fontSize: "1rem !important", color: `${brand.flameGlow} !important` }} />}
                label="Open to urgent"
                sx={{ fontWeight: 700, bgcolor: "rgba(238,59,46,0.16)", color: brand.flameGlow }}
              />
            )}
            {wp && (
              <Chip
                icon={<CalendarTodayIcon sx={{ fontSize: "0.9rem !important", color: `${PREF_BLUE} !important` }} />}
                label={wp}
                sx={{ fontWeight: 700, bgcolor: "rgba(138,180,255,0.14)", color: PREF_BLUE }}
              />
            )}
          </Stack>
        </Box>

        {/* Stat strip */}
        {stats.length > 0 && (
          <Box sx={{ ...cardSx, mb: 2 }}>
            <Stack direction="row" sx={{ alignItems: "stretch", justifyContent: "space-between" }}>
              {stats.map((s, i) => (
                <Box
                  key={s.label}
                  sx={{
                    flex: 1,
                    textAlign: "center",
                    px: 0.5,
                    ...(i > 0 && { borderLeft: `1px solid ${HAIRLINE}` }),
                  }}
                >
                  <Box sx={{ color: brand.teal, display: "flex", justifyContent: "center", "& svg": { fontSize: "1.5rem" } }}>
                    {s.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", lineHeight: 1.1, mt: 0.75 }}>
                    {s.value}
                  </Typography>
                  <Typography sx={{ color: MUTED, fontSize: "0.72rem", fontWeight: 500, mt: 0.25 }}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Stack spacing={2}>
          {/* About */}
          {candidate.bio && (
            <Box sx={cardSx}>
              <SectionTitle icon={<PersonOutlineIcon sx={{ fontSize: "1.2rem" }} />} title="About" />
              <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.65, color: "rgba(255,255,255,0.86)" }}>
                {candidate.bio}
              </Typography>
            </Box>
          )}

          {/* Experience */}
          {candidate.experience && candidate.experience.length > 0 && (
            <Box sx={cardSx}>
              <SectionTitle
                icon={<WorkOutlineIcon sx={{ fontSize: "1.2rem" }} />}
                title="Experience"
                action={
                  candidate.cv_url ? (
                    <Button
                      component="a"
                      href={candidate.cv_url}
                      target="_blank"
                      sx={{ color: brand.tealBright, fontWeight: 700, px: 1, minWidth: 0, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
                    >
                      View all
                    </Button>
                  ) : undefined
                }
              />
              {/* Timeline: an orange rail with ringed dots. */}
              <Stack sx={{ position: "relative", pl: 0.5 }}>
                {candidate.experience.map((x, i, arr) => (
                  <Box key={x.id} sx={{ display: "flex", gap: 1.75, position: "relative" }}>
                    <Box sx={{ position: "relative", flexShrink: 0, width: 12, display: "flex", justifyContent: "center" }}>
                      {i < arr.length - 1 && (
                        <Box sx={{ position: "absolute", top: 14, bottom: -6, width: 2, bgcolor: `${brand.teal}55` }} />
                      )}
                      <Box
                        sx={{
                          mt: "5px",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: brand.teal,
                          border: `2px solid ${CARD}`,
                          boxShadow: `0 0 0 2px ${brand.teal}55`,
                          zIndex: 1,
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1, pb: i < arr.length - 1 ? 2.5 : 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}>
                        <Typography sx={{ fontWeight: 800 }}>
                          {x.title} · {x.company}
                        </Typography>
                        {(x.start_label || x.end_label || x.is_current) && (
                          <Chip
                            size="small"
                            label={[x.start_label, x.is_current ? "Present" : x.end_label].filter(Boolean).join(" - ")}
                            sx={{ height: 22, fontWeight: 700, fontSize: "0.72rem", bgcolor: "rgba(239,125,0,0.16)", color: brand.tealBright }}
                          />
                        )}
                      </Stack>
                      {x.location && (
                        <Typography variant="caption" sx={{ color: MUTED }}>
                          {x.location}
                        </Typography>
                      )}
                      {x.description && (
                        <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.55, color: MUTED }}>
                          {x.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Key skills — cuisine chips + a "what I do best" checklist */}
          {(candidate.specialisms.length > 0 || candidate.cuisines.length > 0 || candidate.interests.length > 0) && (
            <Box sx={cardSx}>
              <SectionTitle icon={<RestaurantIcon sx={{ fontSize: "1.2rem" }} />} title="Key skills" />
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
            </Box>
          )}

          {/* Languages */}
          {candidate.languages.length > 0 && (
            <Box sx={cardSx}>
              <SectionTitle icon={<TranslateIcon sx={{ fontSize: "1.2rem" }} />} title="Languages" />
              <ChipRow items={candidate.languages} />
            </Box>
          )}

          {/* Looking for */}
          {(candidate.desired_roles.length > 0 || candidate.desired_areas.length > 0 || candidate.desired_pay_aed != null || wp) && (
            <Box sx={cardSx}>
              <SectionTitle icon={<TrackChangesOutlinedIcon sx={{ fontSize: "1.2rem" }} />} title="Looking for" />
              <Stack spacing={1.75}>
                {wp && (
                  <LabelledValue label="Work type"><Typography sx={{ fontWeight: 700 }}>{wp}</Typography></LabelledValue>
                )}
                {candidate.desired_roles.length > 0 && (
                  <LabelledValue label="Roles"><ChipRow items={candidate.desired_roles} /></LabelledValue>
                )}
                {candidate.desired_areas.length > 0 && (
                  <LabelledValue label="Preferred areas"><ChipRow items={candidate.desired_areas} /></LabelledValue>
                )}
                {candidate.desired_pay_aed != null && (
                  <LabelledValue label="Target rate">
                    <Typography sx={{ fontWeight: 800, color: brand.tealBright }}>
                      {formatPay(candidate.desired_pay_aed, candidate.desired_pay_unit ?? "shift")}
                    </Typography>
                  </LabelledValue>
                )}
              </Stack>
            </Box>
          )}

          {/* Reviews */}
          {candidate.reviews && candidate.reviews.length > 0 && (
            <Box sx={cardSx}>
              <SectionTitle icon={<StarIcon sx={{ fontSize: "1.2rem" }} />} title="Reviews" />
              <Stack spacing={2}>
                {candidate.reviews.map((r, i) => (
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
                        {r.author_role && (
                          <Typography variant="caption" sx={{ color: MUTED }}>{r.author_role}</Typography>
                        )}
                        {r.body && <Typography variant="body2" sx={{ mt: 0.5, color: "rgba(255,255,255,0.86)" }}>{r.body}</Typography>}
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Certifications */}
          {candidate.certifications.length > 0 && (
            <Box sx={cardSx}>
              <SectionTitle icon={<WorkspacePremiumIcon sx={{ fontSize: "1.2rem" }} />} title="Certifications" />
              <ChipRow items={candidate.certifications} />
            </Box>
          )}
        </Stack>
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

// Circled orange icon + uppercase title, with an optional right-aligned action.
function SectionTitle({ icon, title, action }: { icon?: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `1.5px solid ${brand.teal}`,
            color: brand.teal,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#fff" }}>
          {title}
        </Typography>
      </Stack>
      {action}
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

// Two-column checklist with orange checks — the "what I do best" treatment.
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
