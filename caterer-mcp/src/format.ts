// Small display helpers (mirrors the app's format.ts, Dubai-timezone aware).

export function aed(n: number): string {
  return `AED ${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })}`;
}

export function payLine(payAed: number, payUnit: string): string {
  return payUnit === "year" ? `${aed(payAed)} / year` : `${aed(payAed)}/${payUnit}`;
}

export function dubaiTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dubai",
  });
}

interface JobRow {
  id: string;
  title: string;
  venue: string;
  location_area: string;
  role_type?: string;
  pay_aed: number;
  pay_unit: string;
  start_at: string;
  is_urgent?: boolean;
  is_temp?: boolean;
  description?: string | null;
  dress_code?: string | null;
  business?: { name?: string } | null;
}

// One-line job summary for list views.
export function jobLine(j: JobRow): string {
  const urgent = j.is_urgent ? "  [URGENT]" : "";
  return [
    `• ${j.title} · ${j.venue} (${j.location_area})${urgent}`,
    `  ${payLine(j.pay_aed, j.pay_unit)} · starts ${dubaiTime(j.start_at)}`,
    `  job_id: ${j.id}`,
  ].join("\n");
}

// Full job detail.
export function jobDetail(j: JobRow): string {
  const lines = [
    `${j.title}${j.is_urgent ? "  [URGENT]" : ""}`,
    `Venue: ${j.venue}${j.business?.name ? ` (${j.business.name})` : ""}`,
    `Area: ${j.location_area}`,
    `Pay: ${payLine(j.pay_aed, j.pay_unit)}${j.is_temp ? " · temp/shift" : ""}`,
    `Starts: ${dubaiTime(j.start_at)}`,
  ];
  if (j.role_type) lines.push(`Role type: ${j.role_type}`);
  if (j.dress_code) lines.push(`Dress code: ${j.dress_code}`);
  if (j.description) lines.push("", j.description);
  lines.push("", `job_id: ${j.id}`);
  return lines.join("\n");
}
