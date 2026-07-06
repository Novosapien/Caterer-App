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
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import PhoneField from "@/components/PhoneField";
import { applyToGig, autoApply } from "@/app/(candidate)/actions";
import { brand } from "@/theme/brand";

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
}: {
  jobId: string;
  candidate?: ApplyCandidate | null;
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
          <Button variant="text" color="inherit" size="small" onClick={() => setStep("details")}>
            Apply with a different number
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
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${brand.line}`,
        bgcolor: "background.paper",
      }}
    >
      <Collapse in={step === "done"}>
        <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", py: 1 }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: brand.herb }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            You&rsquo;ve applied!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We&rsquo;ll WhatsApp you if it&rsquo;s a match. Turn on availability in your profile to
            get pinged for urgent gigs first.
          </Typography>
          <Button variant="outlined" color="inherit" onClick={reset} sx={{ mt: 1 }}>
            Keep browsing
          </Button>
        </Stack>
      </Collapse>

      {step !== "done" && (
        <>
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Apply in 20 seconds
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No CV, no sign-up. Just your name and mobile.
              </Typography>
            </Box>
            <IconButton size="small" aria-label="close apply" onClick={reset}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5, borderRadius: 3 }}>
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
                onClick={submitDetails}
                disabled={pending}
                sx={{ py: 1.5 }}
              >
                {pending ? "Applying…" : "Apply"}
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
