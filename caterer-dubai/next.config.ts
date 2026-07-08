import type { NextConfig } from "next";

// Manual PWA (manifest + public/sw.js registered client-side) — keeps Next 16's
// default Turbopack, avoiding the webpack-based PWA plugin conflict.
const nextConfig: NextConfig = {
  // Bake the deploying commit SHA into the client bundle so the running app can
  // tell when a newer deploy is live and auto-refresh (see ServiceWorkerRegister
  // + /api/version). Vercel sets VERCEL_GIT_COMMIT_SHA per deploy; "dev" locally.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || "dev",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
