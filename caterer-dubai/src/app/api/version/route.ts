import { NextResponse } from "next/server";

// Reports the commit SHA of the CURRENTLY deployed build at runtime. The client
// (ServiceWorkerRegister) compares this against the SHA baked into its bundle;
// a mismatch means a newer deploy is live, so it reloads to pick up fresh code.
// Never cached — it must reflect whichever deployment is serving right now.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  const buildId = process.env.VERCEL_GIT_COMMIT_SHA || "dev";
  return NextResponse.json(
    { buildId },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
