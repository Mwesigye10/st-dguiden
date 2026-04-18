// Kosmos Åndedræt Service Worker
// Network-first strategy ensures users always get latest updates
const CACHE_NAME = 'kosmos-breath-v3-2026-04-18';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@200;300;400;500&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-first strategy for HTML/JS/JSON, cache-first for assets
self.addEventListener('fetch', event => {
  const request = event.request;
  const accept = request.headers.get('accept') || '';
  const isHTML = accept.includes('text/html');
  const isJSON = request.url.endsWith('.json');
  const isJS = request.url.endsWith('.js');
  
  if(isHTML || isJSON || isJS) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if(response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(c => c || caches.match('/index.html')))
    );
  } else {
    event.respondWith(
      caches.match(request).then(response => {
        if(response) return response;
        return fetch(request).then(fr => {
          if(fr && fr.status === 200) {
            const clone = fr.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return fr;
        });
      })
    );
  }
});
