/* sw.js — simple offline cache for GitHub Pages */
const CACHE = 'ak-cyberpunk-v3';
const ASSETS = [
  './',
  './index.html',
  './assets/profile.jpg',
  './assets/project1.png',
  './assets/project2.png',
  './assets/project3.png',
  './assets/project4.png',
  './assets/project5.png',
  './assets/project6.png',
  './assets/project7.png',
  './resume.pdf',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-first for same-origin assets; network fallback with fill
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return res;
        }).catch(() => caches.match('./index.html'));
      })
    );
  } else {
    // For cross-origin (e.g., GitHub API), go network-first
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
  }
});
