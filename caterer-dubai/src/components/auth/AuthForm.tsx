"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import ApartmentIcon from "@mui/icons-material/ApartmentOutlined";
import MailOutlineIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOffOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { authFormAction, type AuthResult } from "@/app/actions/auth";
import type { BusinessType } from "@/lib/types";
import { brand } from "@/theme/brand";

const BIZ_TYPES: { value: BusinessType; label: string }[] = [
  { value: "recruiter", label: "Recruitment agency" },
  { value: "hotel", label: "Hotel" },
  { value: "eventing", label: "Events / catering" },
];

const ACCENT = brand.teal;
const FIELD_BG = "rgba(255,255,255,0.03)";
const FIELD_BORDER = "rgba(255,255,255,0.12)";

// Chef's toque — MUI has no chef-hat glyph, so we draw one to match the mockup.
function ChefHatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7.5 14.5h9V18a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 18v-3.5Z" />
      <path d="M16.5 14.5a3.75 3.75 0 0 0 .4-7.48A4.25 4.25 0 0 0 12 4a4.25 4.25 0 0 0-4.9 3.02 3.75 3.75 0 0 0 .4 7.48" />
      <path d="M10 15v2.4M14 15v2.4" />
    </svg>
  );
}

// Shared input styling — dark fill, hairline border, orange focus ring.
const inputSx = {
  width: "100%",
  height: 52,
  px: 2,
  bgcolor: FIELD_BG,
  border: `1px solid ${FIELD_BORDER}`,
  borderRadius: "14px",
  color: "#fff",
  fontSize: "1rem",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color .15s ease, box-shadow .15s ease",
  "&::placeholder": { color: "rgba(255,255,255,0.4)" },
  "&:focus": { borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` },
} as const;

// A field row: rounded icon badge on the left, static label + input on the right.
function Field({
  icon,
  label,
  required,
  htmlFor,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1.75, alignItems: "flex-start" }}>
      <Box
        aria-hidden
        sx={{
          flexShrink: 0,
          mt: "30px",
          width: 52,
          height: 52,
          borderRadius: "14px",
          display: "grid",
          placeItems: "center",
          color: "rgba(255,255,255,0.6)",
          bgcolor: FIELD_BG,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component="label"
          htmlFor={htmlFor}
          sx={{ display: "block", fontSize: "0.95rem", fontWeight: 600, color: "rgba(255,255,255,0.92)" }}
        >
          {label}
          {required && <Box component="span" sx={{ color: ACCENT, ml: 0.5 }}>*</Box>}
        </Typography>
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}

// Segmented chef / business tab (orange outline when active).
function KindTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 1.85,
        px: 1,
        borderRadius: "14px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "1rem",
        fontWeight: 700,
        color: active ? ACCENT : "rgba(255,255,255,0.7)",
        bgcolor: active ? "rgba(146,65,153,0.08)" : "rgba(255,255,255,0.02)",
        border: active ? `1.5px solid ${ACCENT}` : `1px solid ${FIELD_BORDER}`,
        transition: "color .15s, background-color .15s, border-color .15s",
        "& svg": { fontSize: "1.35rem" },
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

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
  const [showPw, setShowPw] = useState(false);
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(authFormAction, {
    ok: true,
  });

  const cta = isSignup ? (kind === "business" ? "Create business account" : "Create account") : "Log in";

  return (
    <Box
      component="form"
      action={formAction}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.09)",
        bgcolor: "rgba(255,255,255,0.02)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="kind" value={kind} />

      {isSignup && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 3 }}>
          <KindTab active={kind === "chef"} onClick={() => setKind("chef")} icon={<ChefHatIcon />} label="I'm a chef" />
          <KindTab
            active={kind === "business"}
            onClick={() => setKind("business")}
            icon={<WorkOutlineIcon />}
            label="I'm a business"
          />
        </Box>
      )}

      <Stack spacing={2.5}>
        {isSignup && (
          <Field icon={<PersonOutlineIcon />} label="Your name" required htmlFor="name">
            <Box
              component="input"
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="Enter your name"
              sx={inputSx}
            />
          </Field>
        )}

        {isSignup && kind === "business" && (
          <>
            <Field icon={<WorkOutlineIcon />} label="Business name" required htmlFor="businessName">
              <Box
                component="input"
                id="businessName"
                name="businessName"
                required
                placeholder="Enter your business name"
                sx={inputSx}
              />
            </Field>

            <Field icon={<ApartmentIcon />} label="Business type" htmlFor="businessType">
              {/* MUI Select (not a native <select>) so the open menu is a dark, themed
                  dropdown that matches the rest of the app, not a tiny native popup. The
                  name prop emits a hidden input so the form action still receives it. */}
              <Select
                id="businessType"
                name="businessType"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                fullWidth
                IconComponent={KeyboardArrowDownIcon}
                sx={{
                  height: 52,
                  bgcolor: FIELD_BG,
                  borderRadius: "14px",
                  color: "#fff",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  "& .MuiSelect-select": { py: 0, display: "flex", alignItems: "center" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: FIELD_BORDER },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: FIELD_BORDER },
                  "&.Mui-focused": { boxShadow: `0 0 0 1px ${ACCENT}` },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ACCENT },
                  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.6)" },
                }}
              >
                {BIZ_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </Field>
          </>
        )}

        <Field icon={<MailOutlineIcon />} label="Email" required htmlFor="email">
          <Box
            component="input"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your email address"
            sx={inputSx}
          />
        </Field>

        <Field icon={<LockOutlinedIcon />} label="Password" required htmlFor="password">
          <Box sx={{ position: "relative" }}>
            <Box
              component="input"
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              required
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "Create a password" : "Enter your password"}
              sx={{ ...inputSx, pr: 6 }}
            />
            <IconButton
              type="button"
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((s) => !s)}
              sx={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.55)" }}
            >
              {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          </Box>
          {isSignup && (
            <Typography sx={{ mt: 1, fontSize: "0.85rem", color: "rgba(255,255,255,0.45)" }}>
              At least 8 characters
            </Typography>
          )}
        </Field>

        {state?.error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {state.error}
          </Alert>
        )}

        <Box
          component="button"
          type="submit"
          disabled={pending}
          sx={{
            mt: 0.5,
            width: "100%",
            height: 58,
            border: "none",
            borderRadius: "16px",
            cursor: pending ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            fontFamily: "inherit",
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "#FFFFFF",
            background: `linear-gradient(180deg, ${brand.tealBright} 0%, ${ACCENT} 58%, ${brand.tealDeep} 100%)`,
            boxShadow: "0 16px 40px -16px rgba(146,65,153,0.65)",
            opacity: pending ? 0.7 : 1,
            transition: "opacity .15s, transform .12s",
            "&:active": { transform: pending ? "none" : "scale(0.99)" },
            "& svg": { fontSize: "1.3rem" },
          }}
        >
          {pending ? "Please wait…" : cta}
          {!pending && <ArrowForwardIcon />}
        </Box>
      </Stack>
    </Box>
  );
}
