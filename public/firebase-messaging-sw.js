import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

const firebaseConfig = {
  apiKey: 'AIzaSyBn3tVcJVv6TVeElo3pjap__plXPllYoOE',
  authDomain: 'bolekaweb.firebaseapp.com',
  projectId: 'bolekaweb',
  // Default bucket name without gs://
  storageBucket: 'bolekaweb.appspot.com',
  messagingSenderId: '930497779587',
  appId: '1:930497779587:web:3a57bd7a5a77a7a90608b6',
  measurementId: 'G-CHPM9YS2RG'
};

// Initialize Firebase in service worker
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log('SW: Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Boleka Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: payload.notification?.icon || payload.data?.icon || '/icons/notification-icon.png',
    image: payload.notification?.image || payload.data?.image,
    tag: payload.data?.tag || 'general',
    requireInteraction: payload.data?.requireInteraction === 'true',
    data: payload.data || {},
    actions: []
  };

  // Add action buttons based on notification type
  if (payload.data?.type === 'ml_vision_result') {
    notificationOptions.actions = [
      {
        action: 'view',
        title: 'View Results',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ];
  } else if (payload.data?.type === 'barcode_scanned') {
    notificationOptions.actions = [
      {
        action: 'view_history',
        title: 'View History',
        icon: '/icons/history-icon.png'
      },
      {
        action: 'scan_again',
        title: 'Scan Again',
        icon: '/icons/scan-icon.png'
      }
    ];
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  let url = '/dashboard';

  // Determine URL based on action and notification type
  // ML Vision feature removed; fall back to dashboard regardless of prior actions

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('SW: Notification closed:', event);
  
  // Track notification dismissal if needed
  const data = event.notification.data || {};
  if (data.trackDismissal) {
    // Send analytics event
    fetch('/api/analytics/notification-dismissed', {
      method: 'POST',
      body: JSON.stringify({
        notificationId: data.notificationId,
        type: data.type,
        timestamp: Date.now()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(console.error);
  }
});

// Handle push events (for custom notification handling)
self.addEventListener('push', (event) => {
  console.log('SW: Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('SW: Push data:', data);
      
      // Custom handling for specific push types
       // ML Vision push types deprecated
    } catch (error) {
      console.error('SW: Error parsing push data:', error);
    }
  }
});

// Cache management for offline functionality
self.addEventListener('install', (event) => {
  console.log('SW: Service worker installing...');
  
  event.waitUntil(
    caches.open('boleka-static-v1').then((cache) => cache.addAll(['/icons/notification-icon.png']))
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW: Service worker activating...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove legacy ml-vision caches
          if (cacheName.startsWith('ml-vision-cache-')) return caches.delete(cacheName);
        })
      );
    })
  );
});

console.log('SW: Firebase messaging service worker loaded');