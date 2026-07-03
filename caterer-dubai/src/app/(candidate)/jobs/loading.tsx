import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Card from "@mui/material/Card";

// Shown while the gig feed streams in (Next App Router loading UI). Mirrors the
// real layout (tall hero, search, chips, horizontal cards) so /jobs feels instant.
export default function JobsLoading() {
  return (
    <Box>
      <Skeleton variant="rectangular" height={232} sx={{ transform: "none" }} />
      <Container maxWidth="sm" sx={{ pt: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Skeleton variant="rounded" height={50} sx={{ flex: 1, borderRadius: 999 }} />
          <Skeleton variant="circular" width={48} height={48} />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={90} height={38} sx={{ borderRadius: 999 }} />
          ))}
        </Stack>
        <Stack spacing={2} sx={{ mt: 2.5 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} sx={{ overflow: "hidden" }}>
              <Stack direction="row">
                <Skeleton variant="rectangular" width={150} height={172} sx={{ transform: "none", flexShrink: 0 }} />
                <Box sx={{ flex: 1, p: 2 }}>
                  <Skeleton width="45%" height={26} />
                  <Skeleton width="70%" height={26} sx={{ mt: 0.75 }} />
                  <Skeleton width="50%" height={20} sx={{ mt: 1 }} />
                  <Skeleton width="55%" height={20} sx={{ mt: 0.5 }} />
                </Box>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
