// ══════════════════════════════════════════════
//  AluGest Pro — Service Worker  v2.0
//  Estrategia: Cache-first para assets, 
//              Network-first para datos
// ══════════════════════════════════════════════

const CACHE_NAME = 'alugest-v2';

// Archivos que se cachean al instalar
const PRECACHE = [
    './ListaMaterial.html',
    './manifest.json'
];

// ── Instalación: precachear archivos base ──
self.addEventListener('install', event => {
    console.log('[SW] Instalando v2...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Precacheando archivos base');
                return cache.addAll(PRECACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// ── Activación: limpiar caches viejos ──
self.addEventListener('activate', event => {
    console.log('[SW] Activando v2...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Eliminando cache viejo:', key);
                        return caches.delete(key);
                    })
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch: estrategia según tipo de recurso ──
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Peticiones a Firebase / APIs externas → siempre red
    if (
        url.hostname.includes('firebase') ||
        url.hostname.includes('google') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic') ||
        url.protocol === 'chrome-extension:'
    ) {
        return; // dejar pasar sin interceptar
    }

    // Archivos de la app → Network-first (siempre actualizado) con fallback a cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200 && response.type !== 'opaque') {
                    const toCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, toCache));
                }
                return response;
            })
            .catch(() => {
                // Sin red → intentar cache
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (event.request.destination === 'document') {
                        return caches.match('./ListaMaterial.html');
                    }
                });
            })
    );
});

// ── Mensaje desde la app para forzar update ──
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
