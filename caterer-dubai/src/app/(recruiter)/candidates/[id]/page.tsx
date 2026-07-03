import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Rating from "@mui/material/Rating";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlaceIcon from "@mui/icons-material/Place";
import BoltIcon from "@mui/icons-material/Bolt";
import CircleIcon from "@mui/icons-material/Circle";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import DescriptionIcon from "@mui/icons-material/Description";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import TranslateIcon from "@mui/icons-material/Translate";
import StarIcon from "@mui/icons-material/Star";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import { getCandidate } from "@/lib/queries";
import { formatPay } from "@/lib/format";
import EmptyState from "@/components/EmptyState";
import ProfileViewTracker from "@/components/recruiter/ProfileViewTracker";
import { brand } from "@/theme/brand";
import type { WorkPref } from "@/lib/types";

function workPrefLabel(w: WorkPref | null | undefined): string | null {
  if (w === "shift") return "Temp / shift work";
  if (w === "permanent") return "Full-time / permanent";
  if (w === "both") return "Shift or full-time";
  return null;
}

export default async function CandidateCvPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ job?: string }>;
}) {
  const { id } = await params;
  const { job } = await searchParams;
  const candidate = await getCandidate(id);

  if (!candidate) {
    return <EmptyState title="Candidate not found" subtitle="This profile is unavailable." />;
  }

  const name = candidate.profile?.name ?? "Candidate";
  const backHref = job ? `/jobs/${job}/applicants` : "/recruiter";

  return (
    <>
      {/* Tier-3 trigger: writes the "recruiter viewed your profile — add your CV" notification */}
      <ProfileViewTracker candidateProfileId={candidate.profile_id} />

      <Button
        component="a"
        href={backHref}
        startIcon={<ArrowBackIcon />}
        sx={{ alignSelf: "flex-start", color: brand.muted }}
      >
        {job ? "Applicants" : "Dashboard"}
      </Button>

      {/* Identity */}
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar
            src={candidate.profile?.avatar_url ?? undefined}
            sx={{ bgcolor: brand.flame, width: 72, height: 72, fontSize: "1.6rem" }}
          >
            {name.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }} noWrap>
              {name}
            </Typography>
            {candidate.headline && (
              <Typography color="text.secondary">{candidate.headline}</Typography>
            )}
            {(candidate.rating_count ?? 0) > 0 && (
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.5 }}>
                <Rating value={candidate.rating_avg ?? 0} precision={0.5} readOnly size="small" />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {candidate.rating_avg?.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({candidate.rating_count})
                </Typography>
              </Stack>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.75 }}>
              {candidate.location_area && (
                <Chip
                  size="small"
                  icon={<PlaceIcon sx={{ fontSize: "0.9rem !important" }} />}
                  label={candidate.location_area}
                  variant="outlined"
                />
              )}
              <Chip
                size="small"
                icon={
                  <CircleIcon
                    sx={{ fontSize: "0.7rem !important", color: `${candidate.available ? brand.herb : brand.muted} !important` }}
                  />
                }
                label={candidate.available ? "Available now" : "Not available"}
                sx={{
                  bgcolor: candidate.available ? `${brand.herb}18` : undefined,
                  color: candidate.available ? brand.herb : undefined,
                  fontWeight: 700,
                }}
                variant={candidate.available ? "filled" : "outlined"}
              />
              {candidate.open_to_urgent && (
                <Chip
                  size="small"
                  icon={<BoltIcon sx={{ fontSize: "0.9rem !important", color: `${brand.navy} !important` }} />}
                  label="Open to urgent"
                  sx={{ bgcolor: `${brand.amber}22`, color: brand.navy, fontWeight: 700 }}
                />
              )}
              {workPrefLabel(candidate.work_pref) && (
                <Chip
                  size="small"
                  label={workPrefLabel(candidate.work_pref)}
                  sx={{ bgcolor: brand.cream, fontWeight: 700 }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* About */}
      {(candidate.bio || candidate.years_experience != null) && (
        <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
          <Section title="About">
            {candidate.years_experience != null && (
              <Chip
                size="small"
                label={`${candidate.years_experience} yrs experience`}
                sx={{ bgcolor: brand.cream, fontWeight: 700, mb: candidate.bio ? 1.5 : 0 }}
              />
            )}
            {candidate.bio && (
              <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{candidate.bio}</Typography>
            )}
          </Section>
        </Paper>
      )}

      {/* Experience */}
      {candidate.experience && candidate.experience.length > 0 && (
        <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
          <Section icon={<WorkOutlineIcon sx={{ color: "#fff" }} />} title="Experience">
            <Stack spacing={2}>
              {candidate.experience.map((x) => (
                <Box key={x.id} sx={{ display: "flex", gap: 1.25 }}>
                  <Box sx={{ mt: 0.9, width: 8, height: 8, borderRadius: "50%", bgcolor: brand.flame, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {x.title} · {x.company}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[x.location, [x.start_label, x.is_current ? "Present" : x.end_label].filter(Boolean).join(" – ")]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                    {x.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {x.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Section>
        </Paper>
      )}

      {/* Looking for */}
      {(candidate.desired_roles.length > 0 ||
        candidate.desired_areas.length > 0 ||
        candidate.desired_pay_aed != null) && (
        <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
          <Section icon={<TrackChangesOutlinedIcon sx={{ color: brand.herb }} />} title="Looking for">
            {candidate.desired_roles.length > 0 && (
              <Box sx={{ mb: candidate.desired_areas.length || candidate.desired_pay_aed != null ? 1.5 : 0 }}>
                <Typography variant="caption" color="text.secondary">Roles</Typography>
                <ChipList items={candidate.desired_roles} />
              </Box>
            )}
            {candidate.desired_areas.length > 0 && (
              <Box sx={{ mb: candidate.desired_pay_aed != null ? 1.5 : 0 }}>
                <Typography variant="caption" color="text.secondary">Areas</Typography>
                <ChipList items={candidate.desired_areas} />
              </Box>
            )}
            {candidate.desired_pay_aed != null && (
              <Box>
                <Typography variant="caption" color="text.secondary">Target rate</Typography>
                <Typography sx={{ fontWeight: 800, color: brand.flame }}>
                  {formatPay(candidate.desired_pay_aed, candidate.desired_pay_unit ?? "shift")}
                </Typography>
              </Box>
            )}
          </Section>
        </Paper>
      )}

      {/* Languages */}
      {candidate.languages.length > 0 && (
        <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
          <Section icon={<TranslateIcon sx={{ color: brand.herb }} />} title="Languages">
            <ChipList items={candidate.languages} />
          </Section>
        </Paper>
      )}

      {/* Reviews */}
      {candidate.reviews && candidate.reviews.length > 0 && (
        <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
          <Section icon={<StarIcon sx={{ color: brand.gold }} />} title="Reviews">
            {/* Manual separators: MUI Stack's `divider` prop resolves the element to
                undefined under this Turbopack build, so we render dividers inline. */}
            <Stack spacing={2}>
              {candidate.reviews.map((r, i) => (
                <Box key={r.id}>
                  {i > 0 && <Divider sx={{ mb: 2 }} />}
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                    <Avatar sx={{ width: 38, height: 38, bgcolor: `${brand.gold}22`, color: brand.gold, fontWeight: 800, fontSize: "0.95rem" }}>
                      {(r.author_name?.trim().charAt(0) || "?").toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>{r.author_name}</Typography>
                        <Rating value={r.rating} readOnly size="small" />
                      </Stack>
                      {r.author_role && (
                        <Typography variant="caption" color="text.secondary">{r.author_role}</Typography>
                      )}
                      {r.body && <Typography variant="body2" sx={{ mt: 0.5 }}>{r.body}</Typography>}
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Section>
        </Paper>
      )}

      {/* Specialisms & cuisines */}
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Section icon={<RestaurantIcon sx={{ color: brand.flame }} />} title="Specialisms">
          <ChipList items={candidate.specialisms} empty="No specialisms listed" />
        </Section>

        {candidate.cuisines.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Section title="Cuisines">
              <ChipList items={candidate.cuisines} />
            </Section>
          </>
        )}

        {candidate.interests.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Section title="Interests">
              <ChipList items={candidate.interests} />
            </Section>
          </>
        )}
      </Paper>

      {/* Certifications */}
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Section icon={<WorkspacePremiumIcon sx={{ color: brand.gold }} />} title="Certifications">
          <ChipList items={candidate.certifications} empty="No certifications on file yet" />
        </Section>
      </Paper>

      {/* CV / availability */}
      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <DescriptionIcon sx={{ color: brand.herb }} />
            <Typography sx={{ fontWeight: 700 }}>Curriculum vitae</Typography>
          </Stack>
          {candidate.cv_url ? (
            <Button
              component="a"
              href={candidate.cv_url}
              target="_blank"
              variant="outlined"
              startIcon={<DescriptionIcon />}
            >
              View CV
            </Button>
          ) : (
            <Chip label="CV requested" size="small" sx={{ bgcolor: `${brand.amber}18`, color: brand.navy, fontWeight: 700 }} />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          Opening this profile prompts {name.split(" ")[0]} to add their CV.
        </Typography>
      </Paper>
    </>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.25 }}>
        {icon}
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

function ChipList({ items, empty }: { items: string[]; empty?: string }) {
  if (!items || items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {empty ?? "—"}
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
      {items.map((i) => (
        <Chip key={i} label={i} sx={{ bgcolor: brand.cream, fontWeight: 600 }} />
      ))}
    </Stack>
  );
}
