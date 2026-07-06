import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getSession } from "@/lib/session";
import { getCandidate } from "@/lib/queries";
import { getProfileSections, cardSx, MUTED } from "@/components/candidate/profileSections";

const PAGE = "#0E0E10";

// A single profile section's full detail (About, Experience, Key skills, etc.).
// Reached from the compact section cards on /profile.
export default async function ProfileSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const session = await getSession();
  const candidate =
    session?.role === "candidate" ? await getCandidate(session.profileId) : null;
  if (!candidate) notFound();

  const current = getProfileSections(candidate).find((s) => s.key === section);
  if (!current) notFound();

  return (
    <Box sx={{ bgcolor: PAGE, color: "#fff", minHeight: "100dvh" }}>
      <Container maxWidth="sm" sx={{ pt: 1.5, pb: 6 }}>
        <Stack direction="row" sx={{ alignItems: "center", py: 1 }}>
          <Button
            component="a"
            href="/profile"
            startIcon={<ArrowBackIcon />}
            sx={{ color: MUTED, fontWeight: 600, px: 1, "&:hover": { color: "#fff", bgcolor: "transparent" } }}
          >
            Profile
          </Button>
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mt: 0.5, mb: 2 }}>
          <Box sx={{ color: MUTED, display: "inline-flex", "& svg": { fontSize: "1.5rem" } }}>{current.icon}</Box>
          <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.01em" }}>
            {current.title}
          </Typography>
        </Stack>

        <Box sx={cardSx}>{current.content}</Box>
      </Container>
    </Box>
  );
}
