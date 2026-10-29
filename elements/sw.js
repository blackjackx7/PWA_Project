// 由 scripts/generate-sw.mjs 在 build 時產生，請勿手改
const BUILD = 'b4017af8cb';
const CACHE = `elements-${BUILD}`;
// 圖片快取不跟版本走（換版不清掉）；圖片內容若改了，要換這個名稱才會重新下載
const IMG_CACHE = 'elements-img-v1';
const MAX_IMAGES = 60;

const PRECACHE = ['./', 'assets/index-BYz8-T2Y.js', 'assets/index-DGD6ZaZM.css', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'index.html', 'manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('elements-') && k !== CACHE && k !== IMG_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 圖片：先看快取，沒有才連網並存起來；超過上限就刪最舊的
async function imageResponse(request) {
  const cache = await caches.open(IMG_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) {
    await cache.put(request, res.clone());
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_IMAGES; i++) await cache.delete(keys[i]);
  }
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.includes('/img/')) {
    event.respondWith(imageResponse(request).catch(() => Response.error()));
    return;
  }

  // 其餘：先回快取、背景更新（離線也能開，下次開啟就是新版）
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
