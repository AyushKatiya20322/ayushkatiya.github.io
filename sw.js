const CACHE = "ak-portfolio-v3";
const CORE = ["./", "./index.html", "./404.html", "./assets/profile.jpg", "./assets/icon-192.png", "./assets/icon-512.png", "./resume.pdf", "./manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r; }).catch(async () => (await caches.match(e.request)) || (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error())));
});
