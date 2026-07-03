import type { PayUnit } from "./types";

// AED currency + Dubai-friendly date/time formatting (demo-grade, no i18n lib).

export function formatAED(amount: number): string {
  return `AED ${amount.toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

export function formatPay(amount: number, unit: PayUnit): string {
  // Annual salaries read better with a spaced "/ year".
  if (unit === "year") return `${formatAED(amount)} / year`;
  return `${formatAED(amount)}/${unit}`;
}

const DXB_TZ = "Asia/Dubai";

export function formatStart(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DXB_TZ,
  });
  if (sameDay) return `Tonight at ${time}`;
  if (isTomorrow) return `Tomorrow at ${time}`;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: DXB_TZ,
  }) + `, ${time}`;
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
