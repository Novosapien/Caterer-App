import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeRegistry from "@/theme/ThemeRegistry";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Caterer · Dubai",
  description:
    "Dubai's fastest way to fill catering shifts. Chefs, waiters and crew, apply on the go.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Caterer" },
};

export const viewport: Viewport = {
  themeColor: "#0C2149",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
