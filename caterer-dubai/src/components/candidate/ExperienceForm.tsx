"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import { addExperience } from "@/app/(candidate)/actions";
import { brand } from "@/theme/brand";

// Standalone "add a role" form, shown on its own page (/profile/experience/new) so
// adding experience is a focused step, not an inline card that expands in place.
export default function ExperienceForm() {
  const router = useRouter();
  const [exp, setExp] = useState({
    title: "",
    company: "",
    location: "",
    startLabel: "",
    endLabel: "",
    isCurrent: false,
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  async function submit() {
    if (!exp.title.trim() || !exp.company.trim()) {
      setToast({ msg: "Add a role title and company.", ok: false });
      return;
    }
    setSaving(true);
    const res = await addExperience(exp);
    setSaving(false);
    if (res.ok) {
      router.push("/profile/edit");
      router.refresh();
    } else {
      setToast({ msg: res.error ?? "Could not add experience.", ok: false });
    }
  }

  return (
    <>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
          <WorkOutlineIcon sx={{ color: "#fff" }} />
          <Typography sx={{ fontWeight: 700 }}>Add a role</Typography>
        </Stack>

        <Stack spacing={1.75}>
          <TextField
            label="Role title"
            value={exp.title}
            onChange={(e) => setExp({ ...exp, title: e.target.value })}
            placeholder="e.g. Chef de Partie"
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Company / venue"
            value={exp.company}
            onChange={(e) => setExp({ ...exp, company: e.target.value })}
            placeholder="e.g. Atlantis The Palm"
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Location"
            value={exp.location}
            onChange={(e) => setExp({ ...exp, location: e.target.value })}
            placeholder="e.g. Palm Jumeirah"
            fullWidth
            size="small"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              label="Start (e.g. Jan 2021)"
              value={exp.startLabel}
              onChange={(e) => setExp({ ...exp, startLabel: e.target.value })}
              fullWidth
              size="small"
            />
            <TextField
              label="End"
              value={exp.endLabel}
              onChange={(e) => setExp({ ...exp, endLabel: e.target.value })}
              fullWidth
              size="small"
              disabled={exp.isCurrent}
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={exp.isCurrent}
                onChange={(e) => setExp({ ...exp, isCurrent: e.target.checked })}
                size="small"
              />
            }
            label={<Typography variant="body2">I currently work here</Typography>}
          />
          <TextField
            label="What you did"
            value={exp.description}
            onChange={(e) => setExp({ ...exp, description: e.target.value })}
            placeholder="A line or two on your responsibilities and highlights…"
            multiline
            minRows={3}
            fullWidth
            size="small"
          />
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
        <Button variant="contained" size="large" onClick={submit} disabled={saving} sx={{ flex: 1, py: 1.35, fontWeight: 700 }}>
          {saving ? "Adding…" : "Add role"}
        </Button>
        <Button
          component="a"
          href="/profile/edit"
          variant="text"
          color="inherit"
          size="large"
          sx={{ py: 1.35 }}
        >
          Cancel
        </Button>
      </Stack>

      <Box sx={{ height: 8 }} />

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ mb: 8 }}
      >
        {toast ? (
          <Alert severity={toast.ok ? "success" : "error"} sx={{ borderRadius: 3 }}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
