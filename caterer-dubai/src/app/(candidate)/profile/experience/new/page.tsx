import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExperienceForm from "@/components/candidate/ExperienceForm";
import EmptyState from "@/components/EmptyState";
import { getSession } from "@/lib/session";
import { getCandidate } from "@/lib/queries";
import { brand } from "@/theme/brand";

// Dedicated "add experience" page. The Experience card on /profile/edit links here
// instead of expanding an inline form, so adding a role is its own focused step.
export default async function AddExperiencePage() {
  const session = await getSession();
  const candidate =
    session?.role === "candidate" ? await getCandidate(session.profileId) : null;

  if (!candidate) {
    return (
      <Container maxWidth="sm" sx={{ pt: 4 }}>
        <EmptyState
          title="No profile yet"
          subtitle="Browse jobs and apply to any one. We will create your profile, then you can add your experience here."
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
        <Button component="a" href="/profile/edit" startIcon={<ArrowBackIcon />} sx={{ color: brand.muted }}>
          Edit profile
        </Button>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Add experience
        </Typography>
      </Stack>

      <ExperienceForm />
    </Container>
  );
}
