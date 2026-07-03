import "server-only";

// Twilio Verify REST client (no SDK — plain fetch with Basic auth). Reads env lazily,
// so the app runs fine with these unset (the apply flow falls back to demo OTP).
//
// Required env for real SMS:
//   TWILIO_ACCOUNT_SID       (ACxxxx…)
//   TWILIO_AUTH_TOKEN
//   TWILIO_VERIFY_SERVICE_SID (VAxxxx… — create a Verify Service in the Twilio console)

const BASE = "https://verify.twilio.com/v2";

function cfg() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !service) return null;
  return { sid, token, service };
}

export function isVerifyConfigured(): boolean {
  return cfg() !== null;
}

function authHeader(sid: string, token: string): string {
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}

function parseTwilioError(text: string): string | undefined {
  try {
    const j = JSON.parse(text) as { message?: string };
    return j.message;
  } catch {
    return undefined;
  }
}

// Send an SMS code to `phone` (E.164). Returns ok=false with a reason on failure.
export async function startVerification(
  phone: string,
): Promise<{ ok: boolean; error?: string }> {
  const c = cfg();
  if (!c) return { ok: false, error: "not-configured" };
  try {
    const res = await fetch(`${BASE}/Services/${c.service}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: authHeader(c.sid, c.token),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Channel: "sms" }),
    });
    if (!res.ok) {
      return { ok: false, error: parseTwilioError(await res.text()) ?? `Twilio ${res.status}` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the SMS service." };
  }
}

// Check a code against Twilio Verify. approved=true only when the code matches.
export async function checkVerification(
  phone: string,
  code: string,
): Promise<{ ok: boolean; approved: boolean; error?: string }> {
  const c = cfg();
  if (!c) return { ok: false, approved: false, error: "not-configured" };
  try {
    const res = await fetch(`${BASE}/Services/${c.service}/VerificationCheck`, {
      method: "POST",
      headers: {
        Authorization: authHeader(c.sid, c.token),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Code: code }),
    });
    // 404 = no pending verification (expired or wrong number) — treat as not approved.
    if (res.status === 404) return { ok: true, approved: false };
    if (!res.ok) {
      return {
        ok: false,
        approved: false,
        error: parseTwilioError(await res.text()) ?? `Twilio ${res.status}`,
      };
    }
    const data = (await res.json()) as { status?: string };
    return { ok: true, approved: data.status === "approved" };
  } catch {
    return { ok: false, approved: false, error: "Could not reach the SMS service." };
  }
}
