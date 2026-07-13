import { NextResponse, type NextRequest } from "next/server";

// Smart app-download redirect the QR points at. Detects the phone and forwards to the
// right store; desktop falls back to caterer.com. Uses a store search for "Caterer.com"
// as a safe placeholder (swap PLAY/APP_STORE for the exact listing URLs when available).
const PLAY = "https://play.google.com/store/search?q=Caterer.com&c=apps";
const APP_STORE = "itms-apps://itunes.apple.com/search?term=caterer.com&media=software";
const WEB = "https://www.caterer.com/";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  const target = /android/.test(ua)
    ? PLAY
    : /iphone|ipad|ipod/.test(ua)
      ? APP_STORE
      : WEB;
  // Manual 302 so a custom scheme (itms-apps://) is passed through untouched.
  return new NextResponse(null, { status: 302, headers: { Location: target, "Cache-Control": "no-store" } });
}
