// BUILD 由 scripts/sync.js 在每次同步時改寫，內容有變就會換新快取，舊快取在 activate 時清掉
const BUILD = 'ae33cf3732';
const CACHE = `route-${BUILD}`;
const TILE_CACHE = 'route-tiles'; // 地圖圖磚獨立快取，換版時不清掉
const MAX_TILES = 300;
const TILE_HOSTS = ['wmts.nlsc.gov.tw'];

const PRECACHE = [
  './',
  'index.html',
  'pwa-init.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'images/layers.png',
  'images/layers-2x.png',
  'vendor/leaflet.min.js',
  'vendor/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('route-') && k !== CACHE && k !== TILE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 先回快取、背景更新（stale-while-revalidate）：離線也能開，下次開啟就是新版
function staleWhileRevalidate(request, cacheName, onStored) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            cache.put(request, res.clone()).then(() => onStored && onStored(cache));
          }
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })
  );
}

// 圖磚超過上限就刪最舊的（keys() 依寫入順序排列）
function trimTiles(cache) {
  return cache.keys().then((keys) => {
    const extra = keys.length - MAX_TILES;
    return Promise.all(keys.slice(0, Math.max(0, extra)).map((k) => cache.delete(k)));
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === location.origin) {
    event.respondWith(staleWhileRevalidate(request, CACHE));
  } else if (TILE_HOSTS.includes(url.hostname) || url.hostname.endsWith('.basemaps.cartocdn.com')) {
    event.respondWith(staleWhileRevalidate(request, TILE_CACHE, trimTiles));
  }
});
