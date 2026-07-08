"use client";

import { useEffect } from "react";

// The SHA this bundle was built with (baked in at build time via next.config).
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || "dev";

// Registers the PWA service worker AND auto-updates the app when a newer deploy
// is live. A PWA keeps running the JavaScript it first loaded, so without this a
// stale tab/installed app never picks up a new deploy until a manual hard reload.
// We poll /api/version (the live deploy's SHA); if it differs from the SHA baked
// into this bundle, a newer build is out and we reload once to fetch fresh code.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // 1) Register the service worker for installability / offline shell.
    let registration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          registration = reg;
        })
        .catch(() => {});
    }

    // 2) Auto-refresh when a newer deploy is detected. Skip locally ("dev").
    if (BUILD_ID === "dev") return;

    let reloading = false;
    const checkForUpdate = async () => {
      if (reloading || document.visibilityState !== "visible") return;
      try {
        // Ask the SW to re-check for a new worker too (belt and braces).
        registration?.update().catch(() => {});
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = (await res.json()) as { buildId?: string };
        if (buildId && buildId !== "dev" && buildId !== BUILD_ID) {
          reloading = true;
          window.location.reload();
        }
      } catch {
        // Offline or transient — ignore, we'll check again on the next tick.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(() => void checkForUpdate(), 60_000);
    // Check once shortly after load so a tab left open before a deploy catches up.
    const kickoff = window.setTimeout(() => void checkForUpdate(), 3_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
      window.clearTimeout(kickoff);
    };
  }, []);

  return null;
}
