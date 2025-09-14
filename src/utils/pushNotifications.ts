// src/utils/pushNotifications.ts

// =================================================================================================
// IMPORTANT: VAPID Public Key
// You need to generate your own VAPID keys for web push notifications.
// These keys are used to identify your application server.
// You can generate them using the `web-push` library:
// 1. Install web-push globally: `npm install -g web-push`
// 2. Generate keys: `web-push generate-vapid-keys`
// Then, replace the placeholder below with your public key.
// The private key must be kept secret on your backend.
// =================================================================================================
const VAPID_PUBLIC_KEY = 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
        console.error('Service Worker not supported in this browser.');
        return;
    }
    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully with scope:', registration.scope);
    } catch (error) {
        console.error('Service Worker registration failed:', error);
    }
}

export async function subscribeToPush(): Promise<PushSubscription | undefined> {
    if (!('PushManager' in window)) {
        console.error('Push messaging not supported in this browser.');
        return;
    }
    
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY') {
        console.error('VAPID Public Key is not set. Please generate one and add it to pushNotifications.ts');
        alert('Error de configuración: La clave pública para notificaciones no está configurada.');
        return;
    }

    try {
        const permission = await window.Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Permission for notifications was not granted.');
            return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        console.log('User is subscribed:', JSON.stringify(subscription, null, 2));
        alert('¡Suscrito a las notificaciones! La suscripción se ha mostrado en la consola.');

        // In a real app, you would send the subscription object to your backend server
        // await fetch('/api/subscribe', {
        //     method: 'POST',
        //     body: JSON.stringify(subscription),
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        // });

        return subscription;
    } catch (error) {
        console.error('Failed to subscribe the user: ', error);
        alert('La suscripción a las notificaciones ha fallado. Revisa la consola para más detalles.');
    }
}
