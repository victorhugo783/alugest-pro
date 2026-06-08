// AluGest Pro — Service Worker v5
// Estrategia: Network First con fallback a caché
// Ciclo de vida: skipWaiting + clients.claim para activación inmediata

const CACHE_NAME   = 'alugest-v5';
const CACHE_ASSETS = ['./ListaMaterial.html', './manifest.json'];

// ── INSTALL: cachear assets críticos y tomar control de inmediato ──
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_ASSETS))
    );
});

// ── ACTIVATE: limpiar cachés obsoletos y reclamar clientes activos ──
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── FETCH: Network First ──
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Nunca interceptar: Firebase, Google APIs, extensiones, y solicitudes POST
    if (
        url.hostname.includes('firebase')        ||
        url.hostname.includes('firestore')       ||
        url.hostname.includes('googleapis.com')  ||
        url.hostname.includes('gstatic.com')     ||
        url.protocol === 'chrome-extension:'     ||
        event.request.method !== 'GET'
    ) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseClone))
                        .catch(() => {});
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request)
                    .then(cached => cached || caches.match('./ListaMaterial.html'))
            )
    );
});

// ── MESSAGE: permitir forzar actualización desde la app ──
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
