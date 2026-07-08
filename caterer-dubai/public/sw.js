// Minimal service worker — makes the app installable + a basic offline shell.
// App code freshness is handled by the version poll in ServiceWorkerRegister, not
// by caching here (navigations stay network-first). Bump CACHE to evict old shells.
const CACHE = "caterer-v2";
const PRECACHE = ["/", "/jobs", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // Network-first for navigations, cache fallback (offline shell).
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || caches.match("/"))));
    return;
  }
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
