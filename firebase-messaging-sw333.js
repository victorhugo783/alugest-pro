// ══════════════════════════════════════════════
//  AluGest Pro — Firebase Messaging Service Worker
//  Requerido por FCM para notificaciones en background
// ══════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCH1fPqUeAI8pdzTw6LK8_EtzlVDaOkFqY",
    authDomain: "alugest-pro.firebaseapp.com",
    projectId: "alugest-pro",
    storageBucket: "alugest-pro.firebasestorage.app",
    messagingSenderId: "732479666613",
    appId: "1:732479666613:web:e82bdc0bf8aa54a2f801fc"
});

const messaging = firebase.messaging();

// Manejar notificaciones cuando la app está en BACKGROUND (minimizada o cerrada)
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] Mensaje en background:', payload);

    const { title, body, icon } = payload.notification || {};

    self.registration.showNotification(title || 'AluGest Pro', {
        body: body || '',
        icon: icon || './icon-192.png',
        badge: './icon-192.png',
        tag: 'alugest-notif',
        vibrate: [200, 100, 200],
        data: payload.data || {}
    });
});

// Clic en notificación → abrir la app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Si ya hay una ventana abierta, enfocarla
            for (const client of clientList) {
                if (client.url.includes('alugest') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no hay ventana, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow('./ListaMaterial.html');
            }
        })
    );
});
