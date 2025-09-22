import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

let messaging: Messaging;

// Initialize messaging for client-side only
if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  tag?: string;
  requireInteraction?: boolean;
}

export interface FCMTokenData {
  token: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    timestamp: number;
  };
}

export class FirebaseCloudMessaging {
  private static readonly VAPID_KEY = 'BCR8QcZj_9FJ8x1bwYRWlP8L5aBN6QZhz_MJKFkjL4tN2qV0C8pXdQYf3RjTlGm5Xx1_VpHkL6r4Q2z8W9dKj5s'; // Replace with your VAPID key

  /**
   * Request notification permission and get FCM token
   */
  static async getToken(userId: string): Promise<string | null> {
    try {
      if (typeof window === 'undefined' || !messaging) {
        console.warn('FCM: Not running in browser environment');
        return null;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('FCM: Notification permission not granted');
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: this.VAPID_KEY
      });

      if (token) {
        console.log('FCM Token:', token);
        
        // Save token to backend
        await this.saveTokenToBackend(token, userId);
        
        return token;
      } else {
        console.warn('FCM: No registration token available');
        return null;
      }

    } catch (error) {
      console.error('FCM: Error getting token:', error);
      return null;
    }
  }

  /**
   * Set up foreground message listener
   */
  static onMessage(callback: (payload: any) => void): (() => void) | null {
    try {
      if (typeof window === 'undefined' || !messaging) {
        console.warn('FCM: Not running in browser environment');
        return null;
      }

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('FCM: Message received in foreground:', payload);
        
        // Show notification if app is in foreground
        this.showNotification(payload);
        
        // Call custom callback
        callback(payload);
      });

      return unsubscribe;
    } catch (error) {
      console.error('FCM: Error setting up message listener:', error);
      return null;
    }
  }

  /**
   * Save FCM token to backend
   */
  private static async saveTokenToBackend(token: string, userId: string): Promise<void> {
    try {
      const tokenData: FCMTokenData = {
        token,
        userId,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now()
        }
      };

      const response = await fetch('/api/fcm/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenData)
      });

      if (!response.ok) {
        throw new Error('Failed to save FCM token');
      }

      console.log('FCM: Token saved to backend');
    } catch (error) {
      console.error('FCM: Error saving token to backend:', error);
    }
  }

  /**
   * Show browser notification
   */
  private static showNotification(payload: any): void {
    try {
      const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
      const notificationOptions: NotificationOptions = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: payload.notification?.icon || payload.data?.icon || '/icons/notification-icon.png',
        tag: payload.data?.tag || 'general',
        requireInteraction: payload.data?.requireInteraction === 'true',
        data: payload.data || {}
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(notificationTitle, notificationOptions);
        });
      } else {
        new Notification(notificationTitle, notificationOptions);
      }
    } catch (error) {
      console.error('FCM: Error showing notification:', error);
    }
  }

  /**
   * Send notification to specific user
   */
  static async sendNotificationToUser(
    userId: string, 
    notification: NotificationPayload
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          notification
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const result = await response.json();
      console.log('FCM: Notification sent:', result);
      
      return result.success;
    } catch (error) {
      console.error('FCM: Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send notification related to ML Vision analysis
   */
  static async sendMLVisionNotification(
    userId: string,
    analysisType: 'barcode' | 'text' | 'labels',
    details: {
      itemsFound: number;
      preview?: string;
      imageId?: string;
    }
  ): Promise<boolean> {
    const notifications = {
      barcode: {
        title: '🏷️ Barcode Detected',
        body: `Found ${details.itemsFound} barcode${details.itemsFound !== 1 ? 's' : ''}${details.preview ? ': ' + details.preview : ''}`,
        icon: '/icons/barcode-icon.png',
        tag: 'ml-barcode'
      },
      text: {
        title: '📄 Text Extracted',
        body: `Extracted text from image${details.preview ? ': ' + details.preview.substring(0, 50) + '...' : ''}`,
        icon: '/icons/text-icon.png',
        tag: 'ml-text'
      },
      labels: {
        title: '🏷️ Image Analyzed',
        body: `Detected ${details.itemsFound} label${details.itemsFound !== 1 ? 's' : ''} in your image`,
        icon: '/icons/labels-icon.png',
        tag: 'ml-labels'
      }
    };

    const notification = notifications[analysisType];
    
    return this.sendNotificationToUser(userId, {
      ...notification,
      data: {
        type: 'ml_vision_result',
        analysisType,
        imageId: details.imageId || '',
        timestamp: Date.now().toString()
      }
    });
  }

  /**
   * Send notification for barcode scan completion
   */
  static async notifyBarcodeScanned(
    userId: string,
    barcodeData: string,
    barcodeType: string
  ): Promise<boolean> {
    return this.sendNotificationToUser(userId, {
      title: '✅ Barcode Scanned',
      body: `${barcodeType}: ${barcodeData.substring(0, 20)}${barcodeData.length > 20 ? '...' : ''}`,
      icon: '/icons/success-icon.png',
      tag: 'barcode-scanned',
      data: {
        type: 'barcode_scanned',
        barcodeData,
        barcodeType,
        timestamp: Date.now().toString()
      }
    });
  }

  /**
   * Initialize FCM for a user session
   */
  static async initializeForUser(userId: string): Promise<boolean> {
    try {
      // Get FCM token
      const token = await this.getToken(userId);
      
      if (!token) {
        console.warn('FCM: Could not initialize - no token obtained');
        return false;
      }

      // Set up message listener
      const unsubscribe = this.onMessage((payload) => {
        console.log('FCM: Received message for user:', userId, payload);
        
        // Handle ML Vision specific notifications
        if (payload.data?.type === 'ml_vision_result') {
          // You can add custom handling here
          console.log('FCM: ML Vision result notification received');
        }
      });

      // Store unsubscribe function for cleanup
      if (typeof window !== 'undefined') {
        (window as any).fcmUnsubscribe = unsubscribe;
      }

      console.log('FCM: Successfully initialized for user:', userId);
      return true;

    } catch (error) {
      console.error('FCM: Error initializing for user:', error);
      return false;
    }
  }

  /**
   * Cleanup FCM listeners
   */
  static cleanup(): void {
    try {
      if (typeof window !== 'undefined' && (window as any).fcmUnsubscribe) {
        (window as any).fcmUnsubscribe();
        delete (window as any).fcmUnsubscribe;
      }
      console.log('FCM: Cleanup completed');
    } catch (error) {
      console.error('FCM: Error during cleanup:', error);
    }
  }
}

export default FirebaseCloudMessaging;