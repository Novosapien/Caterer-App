import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { listPackages } from "@/lib/queries";
import { createServiceClient } from "@/lib/supabase/server";
import { DEMO_BUSINESS_ID } from "@/lib/demo";
import { getRemainingCredits } from "../actions";
import PackageCard from "@/components/recruiter/PackageCard";
import { brand } from "@/theme/brand";

export default async function PackagesPage() {
  const packages = await listPackages();
  const db = createServiceClient();

  // Current plan = most recently purchased package for this business.
  const { data: lastPurchase } = await db
    .from("purchases")
    .select("package_id")
    .eq("business_id", DEMO_BUSINESS_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const currentPackageId = (lastPurchase as { package_id?: string } | null)?.package_id ?? null;
  const remaining = await getRemainingCredits(DEMO_BUSINESS_ID);

  return (
    <>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          Packages
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Choose your plan
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Mock checkout — no card needed. Credits unlock gig posting instantly.
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 2,
          bgcolor: "background.paper",
          border: `1px solid ${brand.line}`,
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>
          Job credits remaining: <Box component="span" sx={{ color: remaining <= 0 ? brand.amber : brand.flame }}>{remaining >= 999 ? "Unlimited" : Math.max(0, remaining)}</Box>
        </Typography>
      </Paper>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: "stretch" }}
      >
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            featured={pkg.name === "Caterer Pro"}
            isCurrent={pkg.id === currentPackageId}
          />
        ))}
      </Stack>
    </>
  );
}
