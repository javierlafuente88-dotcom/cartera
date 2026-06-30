const CACHE = 'cartera-gl-v2';
const SHELL = ['./icon-192.png', './icon-512.png', './apple-touch-icon.png', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // gviz / backend van directo a la red (datos siempre frescos)

  const isDoc = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isDoc) {
    // HTML siempre fresco: red sin caché, con respaldo offline
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)).catch(() => {}); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  // resto (íconos, manifest): cache-first rápido
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)).catch(() => {}); return res; }))
  );
});
