// AluGest Pro — Service Worker v5
// Estrategia: Network First con fallback a caché
// Ciclo de vida: skipWaiting + clients.claim para activación inmediata

const CACHE_NAME   = 'alugest-v5';
const CACHE_ASSETS = [
    './ListaMaterial.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// ── INSTALL: cachear assets críticos y tomar control de inmediato ──
self.addEventListener('install', (event) => {
    // skipWaiting garantiza que el nuevo SW no espera
    // a que las pestañas antiguas se cierren
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
            // clients.claim() fuerza a las pestañas ya abiertas a usar
            // este SW sin necesidad de recargar manualmente
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
                // response.ok cubre 200-299 y evita cachear respuestas opaque
                // (status 0) de CDNs externos con CORS restrictivo
                if (response && response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseClone))
                        .catch(() => {}); // falla silenciosa — caché es solo respaldo
                }
                return response;
            })
            .catch(() =>
                // Sin red: servir desde caché, o fallback al HTML principal
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
