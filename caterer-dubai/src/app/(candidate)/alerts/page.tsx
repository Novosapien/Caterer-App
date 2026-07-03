import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import BoltIcon from "@mui/icons-material/Bolt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EmptyState from "@/components/EmptyState";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { brand } from "@/theme/brand";

// Notifications inbox (R3). Includes the Tier-3 "a recruiter viewed your profile — add your
// CV" prompt written by the recruiter stream (R7).
export default async function AlertsPage() {
  const session = await getSession();

  if (session?.role !== "candidate") {
    return (
      <Container maxWidth="sm" sx={{ pt: 4 }}>
        <EmptyState
          icon={<NotificationsNoneIcon fontSize="inherit" />}
          title="No alerts yet"
          subtitle="Apply to a gig to start getting matched — we'll ping you here and on WhatsApp."
        />
        <Box sx={{ textAlign: "center" }}>
          <Button component="a" href="/jobs" variant="contained">
            Browse gigs
          </Button>
        </Box>
      </Container>
    );
  }

  const db = createServiceClient();
  const { data } = await db
    .from("notifications")
    .select("*")
    .eq("profile_id", session.profileId)
    .order("created_at", { ascending: false });
  const notifications = (data ?? []) as AppNotification[];

  return (
    <Container maxWidth="sm" sx={{ pt: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Alerts
      </Typography>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<NotificationsNoneIcon fontSize="inherit" />}
          title="You're all caught up"
          subtitle="Urgent gig matches and recruiter interest will show up here."
        />
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </Stack>
      )}
    </Container>
  );
}

function NotificationRow({ n }: { n: AppNotification }) {
  const meta = decorate(n);
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        border: `1px solid ${brand.line}`,
        bgcolor: n.read ? "background.paper" : "rgba(245,166,35,0.06)",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Avatar sx={{ bgcolor: meta.bg, color: meta.fg, width: 40, height: 40 }}>
          {meta.icon}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{meta.title}</Typography>
          {meta.body && (
            <Typography variant="body2" color="text.secondary">
              {meta.body}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {relativeTime(n.created_at)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

// Map notification type/payload to a display treatment. Unknown types fall back gracefully.
function decorate(n: AppNotification): {
  title: string;
  body?: string;
  icon: React.ReactNode;
  bg: string;
  fg: string;
} {
  const p = n.payload ?? {};
  const asString = (v: unknown) => (typeof v === "string" ? v : undefined);

  switch (n.type) {
    case "profile_viewed":
      return {
        title: "A recruiter viewed your profile",
        body:
          asString(p.message) ??
          asString(p.body) ??
          "Add your CV to stand out — profiles with a CV get shortlisted faster.",
        icon: <UploadFileIcon />,
        bg: "rgba(0,89,102,0.12)",
        fg: brand.herb,
      };
    case "urgent_match":
    case "urgent_gig":
      return {
        title: asString(p.title) ?? "Urgent gig near you",
        body:
          asString(p.venue) ??
          asString(p.body) ??
          "You're a match — reply on WhatsApp to grab it.",
        icon: <BoltIcon />,
        bg: "rgba(245,166,35,0.18)",
        fg: brand.amber,
      };
    default:
      return {
        title: asString(p.title) ?? "New update",
        body: asString(p.body) ?? asString(p.message),
        icon: <VisibilityIcon />,
        bg: brand.cream,
        fg: brand.flame,
      };
  }
}
