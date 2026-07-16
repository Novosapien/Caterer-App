import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ProfileForm from "@/components/candidate/ProfileForm";
import EmptyState from "@/components/EmptyState";
import { getSession } from "@/lib/session";
import { getCandidate } from "@/lib/queries";
import { brand } from "@/theme/brand";

// Edit view for the candidate profile. The polished read view lives at /profile.
export default async function ProfileEditPage() {
  const session = await getSession();
  const candidate =
    session?.role === "candidate" ? await getCandidate(session.profileId) : null;

  if (!candidate) {
    return (
      <Container maxWidth="sm" sx={{ pt: 4 }}>
        <EmptyState
          title="No profile yet"
          subtitle="Browse gigs and apply to any one — we'll create your profile, then you can edit it here."
        />
        <Box sx={{ textAlign: "center" }}>
          <Button component="a" href="/jobs" variant="contained" size="large">
            Browse gigs
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
        <Button component="a" href="/profile" startIcon={<ArrowBackIcon />} sx={{ color: brand.muted }}>
          Profile
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Edit profile
        </Typography>
      </Stack>

      <ProfileForm
        initialAvatarUrl={candidate.profile?.avatar_url ?? null}
        initialName={candidate.profile?.name ?? ""}
        initialHeadline={candidate.headline ?? ""}
        initialBio={candidate.bio ?? ""}
        initialYears={candidate.years_experience ?? null}
        initialAvailable={candidate.available}
        initialOpenToUrgent={candidate.open_to_urgent}
        initialWhatsappOptIn={candidate.whatsapp_opt_in ?? false}
        initialInterests={candidate.interests ?? []}
        initialLanguages={candidate.languages ?? []}
        initialWorkPref={candidate.work_pref ?? null}
        initialDesiredRoles={candidate.desired_roles ?? []}
        initialDesiredAreas={candidate.desired_areas ?? []}
        initialDesiredPayAed={candidate.desired_pay_aed ?? null}
        initialDesiredPayUnit={candidate.desired_pay_unit ?? null}
        initialCvUrl={candidate.cv_url ?? null}
        experience={candidate.experience ?? []}
      />
    </Container>
  );
}
