"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import BoltIcon from "@mui/icons-material/Bolt";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { createJob, uploadBusinessImage, type CreateJobResult } from "@/app/(recruiter)/actions";
import { brand } from "@/theme/brand";

const ROLE_TYPES = [
  "Head Chef",
  "Sous Chef",
  "Chef de Partie",
  "Commis Chef",
  "Pastry Chef",
  "Waiter",
  "Barista",
  "Bartender",
  "Event Crew",
  "Kitchen Porter",
];

// Sentinel value for the "Other" menu item — reveals a free-text role field.
const OTHER_ROLE = "__other__";

const AREAS = [
  "Palm Jumeirah",
  "Downtown Dubai",
  "DIFC",
  "Business Bay",
  "Dubai Marina",
  "Jumeirah",
  "Deira",
  "Al Barsha",
];

function defaultStart() {
  const d = new Date();
  d.setHours(d.getHours() + 4, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

// Controlled post-gig form. Fields are React state, so a failed submit NEVER clears
// what was typed (the old version used a form action, which React 19 auto-resets).
export default function PostGigForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [roleType, setRoleType] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [venue, setVenue] = useState("");
  const [area, setArea] = useState("");
  const [payAed, setPayAed] = useState("");
  const [payUnit, setPayUnit] = useState("shift");
  const [startAt, setStartAt] = useState(defaultStart());
  const [dressCode, setDressCode] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isTemp, setIsTemp] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);

  const [result, setResult] = useState<CreateJobResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploadingImg(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadBusinessImage(fd);
    setUploadingImg(false);
    if (!res.ok || !res.url) {
      setError(res.error ?? "Could not upload the image.");
      return;
    }
    setImageUrl(res.url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Resolve the role: a picked preset, or the free-typed value when "Other" is chosen.
    const resolvedRole = roleType === OTHER_ROLE ? customRole.trim() : roleType;

    // Client-side required check — do this BEFORE anything that could clear state.
    if (!title.trim() || !resolvedRole || !venue.trim() || !area || !payAed.trim() || !startAt) {
      setError(
        roleType === OTHER_ROLE && !customRole.trim()
          ? "Type the role for your gig."
          : "Please fill in all required fields.",
      );
      return;
    }
    const payNum = Number(payAed);
    if (!Number.isFinite(payNum) || payNum <= 0) {
      setError("Enter a valid pay amount.");
      return;
    }

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("role_type", resolvedRole);
    fd.set("venue", venue.trim());
    fd.set("location_area", area);
    fd.set("pay_aed", payAed.trim());
    fd.set("pay_unit", payUnit);
    fd.set("start_at", startAt);
    fd.set("dress_code", dressCode.trim());
    fd.set("description", description.trim());
    fd.set("image_url", imageUrl);
    fd.set("is_urgent", isUrgent ? "true" : "false");
    fd.set("is_temp", isTemp ? "true" : "false");

    startTransition(async () => {
      const res = await createJob(fd);
      if (!res.ok) {
        // Failure keeps every field intact — nothing above is reset.
        setError(res.error === "no-credits" ? "no-credits" : res.error ?? "Something went wrong.");
        return;
      }
      setResult(res);
      setTimeout(() => router.push("/recruiter"), res.isUrgent ? 2600 : 1200);
    });
  };

  const resultMessage = (r: CreateJobResult) => {
    if (!r.isUrgent) return "Gig posted — it's now live in the candidate feed.";
    if ((r.matchCount ?? 0) === 0) return "Gig posted. 0 candidates matched — no chefs notified.";
    if (r.whatsappPending)
      return `Gig posted. ${r.matchCount} chef${r.matchCount === 1 ? "" : "s"} matched — WhatsApp pending (agent offline).`;
    return `Gig posted. Pinged ${r.notifiedCount ?? r.matchCount} available chef${
      (r.notifiedCount ?? r.matchCount) === 1 ? "" : "s"
    } on WhatsApp.`;
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        <TextField
          label="Gig title"
          placeholder="Chef de Partie"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Role type"
            select
            required
            fullWidth
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
          >
            {ROLE_TYPES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
            <MenuItem value={OTHER_ROLE}>Other (type your own)…</MenuItem>
          </TextField>
          <TextField
            label="Venue"
            placeholder="Atlantis The Palm"
            required
            fullWidth
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </Stack>

        {roleType === OTHER_ROLE && (
          <TextField
            label="Role"
            placeholder="e.g. Sushi Chef, Sommelier, Mixologist"
            required
            fullWidth
            autoFocus
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            helperText="Type the exact role title for this gig."
          />
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Area"
            select
            required
            fullWidth
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            {AREAS.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Start"
            type="datetime-local"
            required
            fullWidth
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Pay (AED)"
            type="number"
            required
            fullWidth
            placeholder="320"
            value={payAed}
            onChange={(e) => setPayAed(e.target.value)}
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <TextField
            label="Per"
            select
            fullWidth
            value={payUnit}
            onChange={(e) => setPayUnit(e.target.value)}
            sx={{ maxWidth: 190 }}
          >
            <MenuItem value="shift">shift</MenuItem>
            <MenuItem value="hour">hour</MenuItem>
            <MenuItem value="day">day</MenuItem>
            <MenuItem value="year">year (annual salary)</MenuItem>
          </TextField>
        </Stack>

        <TextField
          label="Dress code (optional)"
          placeholder="Chef whites, black shoes"
          fullWidth
          value={dressCode}
          onChange={(e) => setDressCode(e.target.value)}
        />

        <TextField
          label="Description"
          placeholder="What the shift involves, what you're looking for…"
          multiline
          minRows={3}
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Business/venue image — OPTIONAL */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Business image{" "}
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
              (optional)
            </Box>
          </Typography>
          {imageUrl ? (
            <Box
              sx={{
                position: "relative",
                height: 160,
                borderRadius: 3,
                overflow: "hidden",
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: `1px solid ${brand.line}`,
              }}
            >
              <IconButton
                size="small"
                aria-label="remove image"
                onClick={() => setImageUrl("")}
                sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "#fff" } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Button
              component="label"
              variant="outlined"
              color="inherit"
              fullWidth
              disabled={uploadingImg}
              startIcon={uploadingImg ? <CircularProgress size={18} /> : <AddPhotoAlternateOutlinedIcon />}
              sx={{ py: 2, borderStyle: "dashed", justifyContent: "center" }}
            >
              {uploadingImg ? "Uploading…" : "Add an image of your venue / business"}
              <input hidden type="file" accept="image/*" onChange={handleImage} />
            </Button>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            Shown on the gig card and detail page. You can post without one.
          </Typography>
        </Box>

        <Paper sx={{ p: 2, bgcolor: isUrgent ? `${brand.amber}12` : brand.cream, border: `1px solid ${brand.line}` }}>
          <FormControlLabel
            control={<Switch checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} color="warning" />}
            label={
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                <BoltIcon sx={{ color: brand.amber, fontSize: "1.2rem" }} />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Urgent — start tonight/tomorrow</Typography>
                  <Typography variant="caption" color="text.secondary">
                    <WhatsAppIcon sx={{ fontSize: "0.9rem", verticalAlign: "-2px", color: "#25D366" }} /> Instantly
                    pings matched available chefs on WhatsApp
                  </Typography>
                </Box>
              </Stack>
            }
          />
          <FormControlLabel
            control={<Switch checked={isTemp} onChange={(e) => setIsTemp(e.target.checked)} />}
            label={<Typography sx={{ fontWeight: 700 }}>Temp / one-off shift</Typography>}
            sx={{ mt: 0.5 }}
          />
        </Paper>

        <Button type="submit" variant="contained" size="large" disabled={pending}>
          {pending ? "Posting…" : isUrgent ? "Publish urgent gig" : "Publish gig"}
        </Button>
      </Stack>

      {/* Non-credit inline error */}
      <Snackbar
        open={!!error && error !== "no-credits"}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {error && error !== "no-credits" ? (
          <Alert severity="error" variant="filled" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : undefined}
      </Snackbar>

      {/* Credits exhausted upsell */}
      {error === "no-credits" && (
        <Paper sx={{ mt: 2, p: 2, bgcolor: `${brand.amber}14`, border: `1px solid ${brand.amber}66` }}>
          <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Out of job credits</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            You&apos;ve used all your posts. Buy a package to publish this gig.
          </Typography>
          <Button component={Link} href="/packages" variant="contained" color="warning">
            Buy a package
          </Button>
        </Paper>
      )}

      {/* Success / result toast */}
      <Snackbar open={!!result} autoHideDuration={5000} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {result ? (
          <Alert
            severity={result.isUrgent && (result.matchCount ?? 0) === 0 ? "info" : "success"}
            variant="filled"
            icon={result.isUrgent ? <WhatsAppIcon /> : undefined}
          >
            {resultMessage(result)}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
