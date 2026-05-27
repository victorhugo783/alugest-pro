// ══════════════════════════════════════════════
//  AluGest Pro — Service Worker  v1.0
//  Estrategia: Cache-first para assets, 
//              Network-first para datos
// ══════════════════════════════════════════════

const CACHE_NAME = 'alugest-v1';

// Archivos que se cachean al instalar
const PRECACHE = [
    './ListaMaterial.html',
    './manifest.json'
];

// ── Instalación: precachear archivos base ──
self.addEventListener('install', event => {
    console.log('[SW] Instalando...');
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
    console.log('[SW] Activando...');
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

    // Archivos de la app → Cache-first con fallback a red
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                // Actualizar cache en background (stale-while-revalidate)
                fetch(event.request)
                    .then(fresh => {
                        if (fresh && fresh.status === 200) {
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, fresh));
                        }
                    })
                    .catch(() => {}); // silencioso si no hay red
                return cached;
            }

            // No está en cache → ir a la red y guardar
            return fetch(event.request)
                .then(response => {
                    if (!response || response.status !== 200 || response.type === 'opaque') {
                        return response;
                    }
                    const toCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, toCache));
                    return response;
                })
                .catch(() => {
                    // Sin red y sin cache → página offline básica
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
