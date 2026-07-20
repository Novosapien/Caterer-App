"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { buyPackage } from "@/app/(recruiter)/actions";
import { formatAED } from "@/lib/format";
import { brand } from "@/theme/brand";
import type { Package } from "@/lib/types";

export default function PackageCard({
  pkg,
  featured,
  isCurrent,
}: {
  pkg: Package;
  featured?: boolean;
  isCurrent?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const handleBuy = () => {
    startTransition(async () => {
      const res = await buyPackage(pkg.id);
      if (res.ok) {
        setToast({ msg: `${pkg.name} is active. You can post jobs now.`, ok: true });
        router.refresh();
      } else {
        setToast({ msg: res.error ?? "Checkout failed.", ok: false });
      }
    });
  };

  return (
    <>
      <Card
        sx={{
          flex: 1,
          minWidth: 260,
          position: "relative",
          border: featured ? `2px solid ${brand.flame}` : `1px solid ${brand.line}`,
          boxShadow: featured
            ? "0 24px 60px -30px rgba(194,90,52,0.45)"
            : "0 18px 50px -28px rgba(35,35,37,0.28)",
        }}
      >
        {featured && (
          <Chip
            label="Most popular"
            size="small"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              bgcolor: brand.flame,
              color: "#fff",
              fontWeight: 700,
            }}
          />
        )}
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {pkg.name}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline", mt: 0.5 }}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {formatAED(pkg.price_aed)}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {pkg.job_credits >= 999 ? "Unlimited" : pkg.job_credits} job posts ·{" "}
            {pkg.cv_view_credits >= 999 ? "unlimited" : pkg.cv_view_credits} CV views
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            {pkg.features.map((f) => (
              <Stack key={f} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <CheckCircleIcon sx={{ fontSize: "1.1rem", color: brand.herb }} />
                <Typography variant="body2">{f}</Typography>
              </Stack>
            ))}
          </Stack>

          <Box sx={{ mt: 3 }}>
            {isCurrent ? (
              <Button fullWidth variant="outlined" disabled>
                Current plan
              </Button>
            ) : (
              <Button
                fullWidth
                variant={featured ? "contained" : "outlined"}
                onClick={handleBuy}
                disabled={pending}
              >
                {pending ? "Processing…" : "Choose"}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert severity={toast.ok ? "success" : "error"} onClose={() => setToast(null)} variant="filled">
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
