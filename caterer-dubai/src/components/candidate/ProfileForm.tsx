"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import FormControlLabel from "@mui/material/FormControlLabel";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import BoltIcon from "@mui/icons-material/Bolt";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WorkOutlineIcon from "@mui/icons-material/WorkOutlineOutlined";
import DescriptionIcon from "@mui/icons-material/Description";
import TranslateIcon from "@mui/icons-material/Translate";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import {
  updateCandidateProfile,
  uploadCv,
  uploadAvatar,
  addExperience,
  deleteExperience,
} from "@/app/(candidate)/actions";
import { formatPay } from "@/lib/format";
import { brand } from "@/theme/brand";
import type { CandidateExperience, PayUnit, WorkPref } from "@/lib/types";

const INTEREST_OPTIONS = [
  "urgent temp",
  "pastry",
  "grill",
  "banqueting",
  "fine dining",
  "waiting",
  "bar",
  "Arabic cuisine",
  "Italian",
  "Indian",
  "canapés",
  "events crew",
];

const ROLE_OPTIONS = [
  "Head Chef",
  "Sous Chef",
  "Chef de Partie",
  "Commis Chef",
  "Pastry Chef",
  "Waiter",
  "Head Waiter",
  "Barista",
  "Bartender",
  "Kitchen Porter",
];

const AREA_OPTIONS = [
  "Palm Jumeirah",
  "Downtown Dubai",
  "DIFC",
  "Business Bay",
  "Dubai Marina",
  "Jumeirah",
  "Deira",
  "Al Barsha",
];

const PAY_UNITS: PayUnit[] = ["shift", "hour", "day", "year"];

const LANGUAGE_OPTIONS = [
  "English",
  "Arabic",
  "Hindi",
  "Urdu",
  "Tagalog",
  "French",
  "Italian",
  "Spanish",
  "Russian",
  "Mandarin",
  "Malayalam",
];

const WORK_PREFS: { value: WorkPref; label: string }[] = [
  { value: "shift", label: "Temp / shift work" },
  { value: "permanent", label: "Full-time / permanent" },
  { value: "both", label: "Both" },
];

interface Props {
  initialAvatarUrl: string | null;
  initialName: string;
  initialHeadline: string;
  initialBio: string;
  initialYears: number | null;
  initialAvailable: boolean;
  initialOpenToUrgent: boolean;
  initialInterests: string[];
  initialLanguages: string[];
  initialWorkPref: WorkPref | null;
  initialDesiredRoles: string[];
  initialDesiredAreas: string[];
  initialDesiredPayAed: number | null;
  initialDesiredPayUnit: PayUnit | null;
  initialCvUrl: string | null;
  experience: CandidateExperience[];
}

export default function ProfileForm(props: Props) {
  const router = useRouter();
  const [name, setName] = useState(props.initialName);
  const [headline, setHeadline] = useState(props.initialHeadline);
  const [bio, setBio] = useState(props.initialBio);
  const [years, setYears] = useState<string>(
    props.initialYears != null ? String(props.initialYears) : "",
  );
  const [available, setAvailable] = useState(props.initialAvailable);
  const [openToUrgent, setOpenToUrgent] = useState(props.initialOpenToUrgent);
  const [interests, setInterests] = useState<string[]>(props.initialInterests);
  const [languages, setLanguages] = useState<string[]>(props.initialLanguages);
  const [workPref, setWorkPref] = useState<WorkPref | "">(props.initialWorkPref ?? "");
  const [desiredRoles, setDesiredRoles] = useState<string[]>(props.initialDesiredRoles);
  const [desiredAreas, setDesiredAreas] = useState<string[]>(props.initialDesiredAreas);
  const [payAed, setPayAed] = useState<string>(
    props.initialDesiredPayAed != null ? String(props.initialDesiredPayAed) : "",
  );
  const [payUnit, setPayUnit] = useState<PayUnit>(props.initialDesiredPayUnit ?? "shift");

  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // CV upload
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(props.initialCvUrl);

  // Avatar upload
  const [avatarUrl, setAvatarUrl] = useState<string | null>(props.initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Experience add form
  const [addOpen, setAddOpen] = useState(false);
  const [exp, setExp] = useState({
    title: "",
    company: "",
    location: "",
    startLabel: "",
    endLabel: "",
    isCurrent: false,
    description: "",
  });
  const [savingExp, setSavingExp] = useState(false);

  function toggle(list: string[], set: (v: string[]) => void, tag: string) {
    set(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  }

  function save() {
    if (name.trim() === "") {
      setToast({ msg: "Please enter your name.", ok: false });
      return;
    }
    startTransition(async () => {
      const res = await updateCandidateProfile({
        name,
        headline,
        bio,
        yearsExperience: years.trim() === "" ? null : Number(years),
        available,
        openToUrgent,
        interests,
        languages,
        workPref: workPref === "" ? null : workPref,
        desiredRoles,
        desiredAreas,
        desiredPayAed: payAed.trim() === "" ? null : Number(payAed),
        desiredPayUnit: payAed.trim() === "" ? null : payUnit,
      });
      if (res.ok) {
        router.push("/profile");
      } else {
        setToast({ msg: res.error ?? "Could not save.", ok: false });
      }
    });
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadAvatar(fd);
    setUploadingAvatar(false);
    if (res.ok && res.url) {
      setAvatarUrl(res.url);
      setToast({ msg: "Photo updated.", ok: true });
    } else {
      setToast({ msg: res.error ?? "Could not upload your photo.", ok: false });
    }
  }

  async function handleCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCv(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadCv(fd);
    setUploadingCv(false);
    if (res.ok && res.url) {
      setCvUrl(res.url);
      setToast({ msg: "CV uploaded. You can now auto-apply to gigs.", ok: true });
    } else {
      setToast({ msg: res.error ?? "Could not upload your CV.", ok: false });
    }
  }

  async function submitExperience() {
    if (!exp.title.trim() || !exp.company.trim()) {
      setToast({ msg: "Add a role title and company.", ok: false });
      return;
    }
    setSavingExp(true);
    const res = await addExperience(exp);
    setSavingExp(false);
    if (res.ok) {
      setExp({ title: "", company: "", location: "", startLabel: "", endLabel: "", isCurrent: false, description: "" });
      setAddOpen(false);
      router.refresh();
    } else {
      setToast({ msg: res.error ?? "Could not add experience.", ok: false });
    }
  }

  async function removeExperience(id: string) {
    const res = await deleteExperience(id);
    if (res.ok) router.refresh();
    else setToast({ msg: res.error ?? "Could not remove.", ok: false });
  }

  const chipSx = { fontWeight: 600 } as const;

  return (
    <Stack spacing={2}>
      {/* Photo */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar
            src={avatarUrl ?? undefined}
            sx={{ width: 72, height: 72, background: brand.navy, color: "#fff", fontWeight: 800, fontSize: "1.6rem" }}
          >
            {(name.trim() || "?").charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>Profile photo</Typography>
            <Typography variant="caption" color="text.secondary">
              A clear headshot helps recruiters recognise you.
            </Typography>
          </Box>
          <Button
            component="label"
            variant="outlined"
            color="inherit"
            size="small"
            disabled={uploadingAvatar}
            startIcon={uploadingAvatar ? <CircularProgress size={16} /> : <PhotoCameraOutlinedIcon />}
          >
            {uploadingAvatar ? "Uploading…" : avatarUrl ? "Change" : "Upload"}
            <input hidden type="file" accept="image/*" onChange={handleAvatar} />
          </Button>
        </Stack>
      </Paper>

      {/* About */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Typography sx={{ fontWeight: 700, mb: 1.5 }}>About you</Typography>
        <Stack spacing={1.75}>
          <TextField
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Yusuf Rahman"
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Chef de Partie · 8 yrs fine dining"
            fullWidth
            size="small"
          />
          <TextField
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A couple of lines on your experience and what you're great at…"
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label="Years of experience"
            value={years}
            onChange={(e) => setYears(e.target.value.replace(/[^0-9]/g, ""))}
            type="number"
            size="small"
            sx={{ maxWidth: 200 }}
            slotProps={{ htmlInput: { min: 0, max: 60 } }}
          />
        </Stack>
      </Paper>

      {/* Availability */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <EventAvailableIcon sx={{ color: brand.herb }} />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>Available now</Typography>
              <Typography variant="caption" color="text.secondary">
                Turn on availability → get pinged for urgent gigs.
              </Typography>
            </Box>
          </Stack>
          <Switch checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <BoltIcon sx={{ color: brand.amber }} />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>Open to urgent temp</Typography>
              <Typography variant="caption" color="text.secondary">
                Be first in line for start-tonight shifts on WhatsApp.
              </Typography>
            </Box>
          </Stack>
          <Switch checked={openToUrgent} onChange={(e) => setOpenToUrgent(e.target.checked)} />
        </Stack>
      </Paper>

      {/* CV */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <DescriptionIcon sx={{ color: brand.herb }} />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>Your CV</Typography>
              <Typography variant="caption" color="text.secondary">
                Save it once → auto-apply to any gig in one tap.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {cvUrl && (
              <Button component="a" href={cvUrl} target="_blank" variant="text" size="small" startIcon={<DescriptionIcon />}>
                View
              </Button>
            )}
            <Button
              component="label"
              variant={cvUrl ? "outlined" : "contained"}
              color={cvUrl ? "inherit" : "primary"}
              size="small"
              disabled={uploadingCv}
              startIcon={uploadingCv ? <CircularProgress size={16} /> : undefined}
            >
              {uploadingCv ? "Uploading…" : cvUrl ? "Replace" : "Upload CV"}
              <input hidden type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleCv} />
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Experience */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <WorkOutlineIcon sx={{ color: "#fff" }} />
            <Typography sx={{ fontWeight: 700 }}>Experience</Typography>
          </Stack>
          {!addOpen && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              Add
            </Button>
          )}
        </Stack>

        <Stack spacing={1.5} sx={{ mb: props.experience.length ? 1.5 : 0 }}>
          {props.experience.map((x) => (
            <Box key={x.id} sx={{ display: "flex", gap: 1 }}>
              <Box sx={{ mt: 0.75, width: 8, height: 8, borderRadius: "50%", bgcolor: brand.flame, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {x.title} · {x.company}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {[x.location, [x.start_label, x.is_current ? "Present" : x.end_label].filter(Boolean).join(" – ")]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
                {x.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {x.description}
                  </Typography>
                )}
              </Box>
              <IconButton size="small" aria-label="remove" onClick={() => removeExperience(x.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          {props.experience.length === 0 && !addOpen && (
            <Typography variant="body2" color="text.secondary">
              No experience added yet. Add a role to build out your profile.
            </Typography>
          )}
        </Stack>

        <Collapse in={addOpen}>
          <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: brand.cream, border: `1px solid ${brand.line}` }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField label="Role title" value={exp.title} onChange={(e) => setExp({ ...exp, title: e.target.value })} fullWidth size="small" />
                <TextField label="Company / venue" value={exp.company} onChange={(e) => setExp({ ...exp, company: e.target.value })} fullWidth size="small" />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField label="Location" value={exp.location} onChange={(e) => setExp({ ...exp, location: e.target.value })} fullWidth size="small" />
                <TextField label="Start (e.g. Jan 2021)" value={exp.startLabel} onChange={(e) => setExp({ ...exp, startLabel: e.target.value })} fullWidth size="small" />
                <TextField label="End" value={exp.endLabel} onChange={(e) => setExp({ ...exp, endLabel: e.target.value })} fullWidth size="small" disabled={exp.isCurrent} />
              </Stack>
              <FormControlLabel
                control={<Switch checked={exp.isCurrent} onChange={(e) => setExp({ ...exp, isCurrent: e.target.checked })} size="small" />}
                label={<Typography variant="body2">I currently work here</Typography>}
              />
              <TextField label="What you did" value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} multiline minRows={2} fullWidth size="small" />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={submitExperience} disabled={savingExp}>
                  {savingExp ? "Adding…" : "Add role"}
                </Button>
                <Button variant="text" color="inherit" size="small" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Collapse>
      </Paper>

      {/* Specialisms */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Typography sx={{ fontWeight: 700 }}>Your specialisms</Typography>
        <Typography variant="caption" color="text.secondary">
          Pick what you do → we only ping you for the right gigs.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
          {INTEREST_OPTIONS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => toggle(interests, setInterests, tag)}
              color={interests.includes(tag) ? "primary" : "default"}
              variant={interests.includes(tag) ? "filled" : "outlined"}
              sx={chipSx}
            />
          ))}
        </Box>
      </Paper>

      {/* Languages */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <TranslateIcon sx={{ color: brand.herb }} />
          <Typography sx={{ fontWeight: 700 }}>Languages</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Which languages do you speak?
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
          {LANGUAGE_OPTIONS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => toggle(languages, setLanguages, tag)}
              color={languages.includes(tag) ? "primary" : "default"}
              variant={languages.includes(tag) ? "filled" : "outlined"}
              sx={chipSx}
            />
          ))}
        </Box>
      </Paper>

      {/* Desired work */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${brand.line}` }}>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>What you&rsquo;re looking for</Typography>
        <Typography variant="caption" color="text.secondary">
          Work type, roles and areas you want, plus your target rate.
        </Typography>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1.5, mb: 0.75 }}>
          Work type
        </Typography>
        <TextField
          select
          fullWidth
          size="small"
          value={workPref}
          onChange={(e) => setWorkPref(e.target.value as WorkPref | "")}
          sx={{ maxWidth: 300 }}
        >
          <MenuItem value="">No preference</MenuItem>
          {WORK_PREFS.map((w) => (
            <MenuItem key={w.value} value={w.value}>
              {w.label}
            </MenuItem>
          ))}
        </TextField>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.75 }}>
          Desired roles
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {ROLE_OPTIONS.map((r) => (
            <Chip
              key={r}
              label={r}
              onClick={() => toggle(desiredRoles, setDesiredRoles, r)}
              color={desiredRoles.includes(r) ? "primary" : "default"}
              variant={desiredRoles.includes(r) ? "filled" : "outlined"}
              sx={chipSx}
            />
          ))}
        </Box>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.75 }}>
          Preferred areas
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {AREA_OPTIONS.map((a) => (
            <Chip
              key={a}
              label={a}
              onClick={() => toggle(desiredAreas, setDesiredAreas, a)}
              color={desiredAreas.includes(a) ? "primary" : "default"}
              variant={desiredAreas.includes(a) ? "filled" : "outlined"}
              sx={chipSx}
            />
          ))}
        </Box>

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 0.75 }}>
          Target rate
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <TextField
            label="Amount (AED)"
            value={payAed}
            onChange={(e) => setPayAed(e.target.value.replace(/[^0-9]/g, ""))}
            type="number"
            size="small"
            sx={{ maxWidth: 180 }}
          />
          <TextField
            label="Per"
            select
            value={payUnit}
            onChange={(e) => setPayUnit(e.target.value as PayUnit)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            {PAY_UNITS.map((u) => (
              <MenuItem key={u} value={u}>
                {u === "year" ? "year (annual)" : u}
              </MenuItem>
            ))}
          </TextField>
          {payAed.trim() !== "" && (
            <Typography variant="body2" color="text.secondary">
              {formatPay(Number(payAed), payUnit)}
            </Typography>
          )}
        </Stack>
      </Paper>

      <Button size="large" variant="contained" onClick={save} disabled={pending} sx={{ py: 1.5 }}>
        {pending ? "Saving…" : "Save profile"}
      </Button>

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
    </Stack>
  );
}
