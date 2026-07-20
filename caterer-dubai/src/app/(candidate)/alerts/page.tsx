import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import EmptyState from "@/components/EmptyState";
import AlertsFeed from "@/components/candidate/AlertsFeed";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/server";
import type { AppNotification } from "@/lib/types";

// Notifications inbox (R3). Includes the Tier-3 "a recruiter viewed your profile — add your
// CV" prompt written by the recruiter stream (R7). Header, filter tabs, per-type cards and
// the "boost visibility" CTA live in AlertsFeed (client, for the All/New/Read filtering).
export default async function AlertsPage() {
  const session = await getSession();

  if (session?.role !== "candidate") {
    return (
      <Container maxWidth="sm" sx={{ pt: 4 }}>
        <EmptyState
          icon={<NotificationsNoneIcon fontSize="inherit" />}
          title="No alerts yet"
          subtitle="Apply to a job to start getting matched. We will tell you here and on WhatsApp."
        />
        <Box sx={{ textAlign: "center" }}>
          <Button component="a" href="/jobs" variant="contained">
            Browse jobs
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
    <Box sx={{ bgcolor: "#08080A", color: "#fff", minHeight: "100dvh" }}>
      <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
        {notifications.length === 0 ? (
          <EmptyState
            icon={<NotificationsNoneIcon fontSize="inherit" />}
            title="You're all caught up"
            subtitle="This is where we tell you about jobs that fit you. It is quiet for now."
          />
        ) : (
          <AlertsFeed notifications={notifications} />
        )}
      </Container>
    </Box>
  );
}
