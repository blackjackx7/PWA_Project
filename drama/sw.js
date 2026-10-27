// BUILD 由 scripts/sync.js 在每次同步時改寫，內容有變就會換新快取，舊快取在 activate 時清掉
const BUILD = '676c6fb99b';
const CACHE = `drama-${BUILD}`;

const PRECACHE = [
  './',
  'index.html',
  'pwa-init.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('drama-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 先回快取、背景更新（stale-while-revalidate）：離線也能開，下次開啟就是新版
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request, { ignoreSearch: true }).then((cached) => {
        const network = fetch(request)
          .then((res) => { if (res && res.ok) cache.put(request, res.clone()); return res; })
          .catch(() => cached || Response.error());
        return cached || network;
      })
    )
  );
});
