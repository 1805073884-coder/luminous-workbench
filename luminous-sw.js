// Luminous Workbench Service Worker
// Provides offline support and standalone PWA experience

const CACHE_NAME = 'luminous-v8';
const ASSETS_TO_CACHE = [
  '/luminous-workbench/',
  '/luminous-workbench-manifest.json'
];

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: network-first strategy for the HTML, cache for static assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if(event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For the main HTML page: network first, fallback to cache
  if(url.pathname.endsWith('/luminous-workbench/') || url.pathname.endsWith('/luminous-workbench/index.html')){
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other assets: cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      });
    })
  );
});
