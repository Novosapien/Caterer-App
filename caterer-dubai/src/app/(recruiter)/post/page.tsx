import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LockIcon from "@mui/icons-material/Lock";
import { getSession } from "@/lib/session";
import { getOwnedBusinessId } from "@/lib/queries";
import { getRemainingCredits } from "../actions";
import PostGigForm from "@/components/recruiter/PostGigForm";
import { brand } from "@/theme/brand";

export default async function PostGigPage() {
  const session = await getSession();
  const businessId = session ? await getOwnedBusinessId(session.profileId) : null;
  const remaining = businessId ? await getRemainingCredits(businessId) : 0;

  return (
    <>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Post a gig
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            New shift
          </Typography>
          <Chip
            size="small"
            label={remaining >= 999 ? "Unlimited credits" : `${Math.max(0, remaining)} credit${remaining === 1 ? "" : "s"} left`}
            sx={{
              bgcolor: remaining <= 0 ? `${brand.amber}22` : `${brand.herb}18`,
              color: remaining <= 0 ? brand.navy : brand.herb,
              fontWeight: 700,
            }}
          />
        </Stack>
      </Box>

      {remaining <= 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", border: `1px solid ${brand.amber}66`, bgcolor: `${brand.amber}10` }}>
          <LockIcon sx={{ fontSize: 40, color: brand.amber, mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Posting is locked
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
            You&apos;re out of job credits. Buy a package to unlock gig posting.
          </Typography>
          <Button component="a" href="/packages" variant="contained" color="warning" size="large">
            See packages
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <PostGigForm />
        </Paper>
      )}
    </>
  );
}
