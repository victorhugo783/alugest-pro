// AluGest Pro — Service Worker v3
const CACHE_NAME = 'alugest-v3';

self.addEventListener('install', event => {
    // Tomar control inmediatamente sin esperar
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(['./ListaMaterial.html', './manifest.json']))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    // Firebase y APIs externas — nunca interceptar
    if (url.hostname.includes('firebase') || url.hostname.includes('google') ||
        url.hostname.includes('gstatic') || url.protocol === 'chrome-extension:') return;

    // Siempre red primero — nunca caché viejo
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
                }
                return response;
            })
            .catch(() => caches.match(event.request).then(r => r || caches.match('./ListaMaterial.html')))
    );
});

self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
