const CACHE = 'family-expeditions-v1.9';
const ASSETS = [
  '/FamilyExpeditions/',
  '/FamilyExpeditions/index.html',
  '/FamilyExpeditions/manifest.json',
  '/FamilyExpeditions/icon-192.png',
  '/FamilyExpeditions/icon-512.png',
];

// Install: cache all assets immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete all old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for assets, network-first for version check
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch version.json fresh so update banner works
  if (url.pathname.endsWith('version.json')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (fonts now embedded, no external requests)
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
      )
  );
});
