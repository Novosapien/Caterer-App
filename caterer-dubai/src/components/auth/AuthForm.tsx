"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { authFormAction, type AuthResult } from "@/app/actions/auth";
import type { BusinessType } from "@/lib/types";

const BIZ_TYPES: { value: BusinessType; label: string }[] = [
  { value: "recruiter", label: "Recruitment agency" },
  { value: "hotel", label: "Hotel" },
  { value: "eventing", label: "Events / catering" },
];

// Shared email+password form for /login and /signup. Signup adds a chef-vs-business
// toggle; business reveals business name + type. Uses a form action so success redirects
// natively and failures return an inline error.
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const params = useSearchParams();
  const isSignup = mode === "signup";
  const [kind, setKind] = useState<"chef" | "business">(
    params.get("type") === "business" ? "business" : "chef",
  );
  const [businessType, setBusinessType] = useState<BusinessType>("recruiter");
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(authFormAction, {
    ok: true,
  });

  const cta = isSignup
    ? kind === "business"
      ? "Create business account"
      : "Create account"
    : "Log in";

  return (
    <Box
      component="form"
      action={formAction}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.10)",
        bgcolor: "rgba(255,255,255,0.03)",
      }}
    >
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="kind" value={kind} />

      {isSignup && (
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={kind}
          onChange={(_, v) => v && setKind(v)}
          sx={{
            mb: 2.5,
            "& .MuiToggleButton-root": {
              color: "rgba(255,255,255,0.7)",
              borderColor: "rgba(255,255,255,0.14)",
              fontWeight: 700,
              textTransform: "none",
              "&.Mui-selected": { color: "#fff", bgcolor: "rgba(239,125,0,0.18)" },
            },
          }}
        >
          <ToggleButton value="chef">I&apos;m a chef</ToggleButton>
          <ToggleButton value="business">I&apos;m a business</ToggleButton>
        </ToggleButtonGroup>
      )}

      <Stack spacing={1.75}>
        {isSignup && (
          <TextField
            name="name"
            label={kind === "business" ? "Your name" : "Full name"}
            required
            fullWidth
            autoComplete="name"
          />
        )}
        {isSignup && kind === "business" && (
          <>
            <TextField name="businessName" label="Business name" required fullWidth />
            <TextField
              select
              name="businessType"
              label="Business type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessType)}
              fullWidth
            >
              {BIZ_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </>
        )}
        <TextField name="email" type="email" label="Email" required fullWidth autoComplete="email" />
        <TextField
          name="password"
          type="password"
          label="Password"
          required
          fullWidth
          autoComplete={isSignup ? "new-password" : "current-password"}
          helperText={isSignup ? "At least 8 characters" : undefined}
        />

        {state?.error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {state.error}
          </Alert>
        )}

        <Button type="submit" variant="contained" size="large" disabled={pending} fullWidth sx={{ mt: 0.5 }}>
          {pending ? "Please wait…" : cta}
        </Button>
      </Stack>
    </Box>
  );
}
