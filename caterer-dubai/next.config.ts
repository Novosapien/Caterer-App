import type { NextConfig } from "next";

// Manual PWA (manifest + public/sw.js registered client-side) — keeps Next 16's
// default Turbopack, avoiding the webpack-based PWA plugin conflict.
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
