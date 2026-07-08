"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Collapse from "@mui/material/Collapse";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import BoltIcon from "@mui/icons-material/Bolt";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneField from "@/components/PhoneField";
import { applyToGig, autoApply } from "@/app/(candidate)/actions";
import { brand, surfaces } from "@/theme/brand";

type Step = "collapsed" | "details" | "done";

// Who's viewing — when a chef is already signed in we offer one-tap auto-apply.
export interface ApplyCandidate {
  name: string;
  hasCv: boolean;
}

// Inline, collapsible apply panel (R2). Rendered BELOW the gig summary — not a modal or
// takeover. Signed-in chefs get one-tap ⚡ auto-apply (using their saved profile + CV);
// everyone else gets the phone-first "Apply in 20 seconds" flow.
export default function ApplyPanel({
  jobId,
  candidate,
  gigTitle,
}: {
  jobId: string;
  candidate?: ApplyCandidate | null;
  gigTitle?: string | null;
}) {
  const [step, setStep] = useState<Step>("collapsed");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setStep("collapsed");
    setName("");
    setPhone("");
    setError(null);
  }

  function runAutoApply() {
    setError(null);
    startTransition(async () => {
      const res = await autoApply(jobId);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStep("done");
    });
  }

  function submitDetails() {
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 8) return setError("Please enter a valid mobile number.");
    startTransition(async () => {
      const res = await applyToGig({ jobId, name: name.trim(), phone });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStep("done");
    });
  }

  // --- Collapsed: signed-in chef → auto-apply; anonymous → open the panel ------
  if (step === "collapsed") {
    if (candidate) {
      return (
        <Stack spacing={1}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          )}
          <Button
            fullWidth
            size="large"
            variant="contained"
            startIcon={<BoltIcon />}
            onClick={runAutoApply}
            disabled={pending}
            sx={{ py: 1.75 }}
          >
            {pending ? "Applying…" : "Auto-apply for this gig"}
          </Button>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center", justifyContent: "center", color: "text.secondary" }}
          >
            <DescriptionIcon sx={{ fontSize: "1rem", color: brand.herb }} />
            <Typography variant="caption">
              Applying as <b>{candidate.name}</b>
              {candidate.hasCv ? " · CV attached" : " · add a CV in your profile to stand out"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", my: 0.25 }}>
            <Box sx={{ flex: 1, height: "1px", bgcolor: brand.line }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              or
            </Typography>
            <Box sx={{ flex: 1, height: "1px", bgcolor: brand.line }} />
          </Stack>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="inherit"
            onClick={() => setStep("details")}
            sx={{ py: 1.5, fontWeight: 700, borderColor: brand.line }}
          >
            Apply manually
          </Button>
        </Stack>
      );
    }
    return (
      <Button
        fullWidth
        size="large"
        variant="contained"
        startIcon={<BoltIcon />}
        onClick={() => setStep("details")}
        sx={{ py: 1.75 }}
      >
        Apply
      </Button>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.25, sm: 2.75 },
        borderRadius: 4,
        border: `1px solid ${brand.line}`,
        bgcolor: "rgba(255,255,255,0.035)",
      }}
    >
      {/* --- Success --- */}
      <Collapse in={step === "done"}>
        <Stack spacing={1.75} sx={{ alignItems: "center", textAlign: "center", py: 1.5 }}>
          <Box
            sx={{
              width: 66,
              height: 66,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: brand.herb,
              bgcolor: `${brand.herb}22`,
              border: `1px solid ${brand.herb}55`,
              boxShadow: `0 0 0 7px ${brand.herb}14`,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 34 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              You&rsquo;re in!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
              {gigTitle ? (
                <>
                  Application sent for <b>{gigTitle}</b>.{" "}
                </>
              ) : (
                "Application sent. "
              )}
              We&rsquo;ll WhatsApp you if it&rsquo;s a match.
            </Typography>
          </Box>

          <Stack spacing={1} sx={{ width: "100%", pt: 0.5 }}>
            <Button
              component="a"
              href="/profile"
              fullWidth
              size="large"
              variant="contained"
              sx={{ py: 1.35, fontWeight: 800, background: surfaces.accentGradient }}
            >
              Track my applications
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={reset}
              sx={{ py: 1.05, fontWeight: 700, borderColor: brand.line }}
            >
              Keep browsing
            </Button>
          </Stack>

          <Button
            component="a"
            href="/whatsapp"
            variant="text"
            size="small"
            startIcon={<WhatsAppIcon sx={{ fontSize: "1.05rem", color: "#25D366" }} />}
            sx={{ color: "#25D366", fontWeight: 700 }}
          >
            How WhatsApp alerts work
          </Button>
        </Stack>
      </Collapse>

      {/* --- Manual application form --- */}
      {step !== "done" && (
        <>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "flex-start", mb: 2 }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: surfaces.accentGradient,
                boxShadow: surfaces.tealGlowShadow,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <SendRoundedIcon sx={{ color: "#fff", fontSize: "1.15rem" }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                {candidate ? "Apply manually" : "Apply in 20 seconds"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {candidate
                  ? "Enter the name and mobile you want to apply with."
                  : "No CV, no sign-up. Just your name and mobile."}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label="close apply"
              onClick={reset}
              sx={{ color: "text.secondary", mt: -0.5, mr: -0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {gigTitle && (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: "center",
                mb: 1.75,
                px: 1.25,
                py: 0.85,
                borderRadius: 2.5,
                bgcolor: `${brand.teal}14`,
                border: `1px solid ${brand.teal}2E`,
              }}
            >
              <BoltIcon sx={{ fontSize: "1rem", color: brand.teal }} />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Applying for <b style={{ color: "#fff" }}>{gigTitle}</b>
              </Typography>
            </Stack>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 1.75, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {step === "details" && (
            <Stack spacing={1.5}>
              <TextField
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                autoComplete="name"
              />
              <PhoneField value={phone} onChange={setPhone} />
              <Button
                fullWidth
                size="large"
                variant="contained"
                startIcon={<BoltIcon />}
                onClick={submitDetails}
                disabled={pending}
                sx={{ py: 1.5, fontWeight: 800, background: surfaces.accentGradient }}
              >
                {pending ? "Applying…" : "Submit application"}
              </Button>
            </Stack>
          )}

          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center", mt: 2, color: "text.secondary" }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: "1rem" }} />
            <Typography variant="caption">
              You&rsquo;ll get gig updates on WhatsApp. You can stop any time.
            </Typography>
          </Stack>
        </>
      )}
    </Paper>
  );
}
