import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getCurrentLocation as getGeoLocation } from './geo';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize messaging
let messaging: Messaging | null = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('Firebase messaging not available:', error);
}

export interface PushTokenData {
  token: string;
  userId?: string;
  lat?: number;
  lng?: number;
}

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

/**
 * Request notification permission from the user
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    return { granted: true, denied: false, default: false };
  }

  if (Notification.permission === 'denied') {
    return { granted: false, denied: true, default: false };
  }

  const permission = await Notification.requestPermission();
  return {
    granted: permission === 'granted',
    denied: permission === 'denied',
    default: permission === 'default'
  };
}

/**
 * Get FCM token for push notifications
 */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) {
    throw new Error('Firebase messaging not initialized');
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY;
  if (!vapidKey) {
    throw new Error('VAPID key not configured');
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
}

/**
 * Register push token with the backend
 */
export async function registerPushToken(tokenData: PushTokenData): Promise<boolean> {
  try {
    const response = await fetch('/api/push/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    });

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

/**
 * Update user location for push targeting
 */
export async function updateUserLocation(lat: number, lng: number): Promise<boolean> {
  try {
    const response = await fetch('/api/customers/update-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lng })
    });

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Error updating location:', error);
    return false;
  }
}


/**
 * Set up foreground message listener
 */
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  if (!messaging) {
    console.warn('Firebase messaging not available');
    return () => {};
  }

  return onMessage(messaging, callback);
}

/**
 * Send test notification
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const location = await getGeoLocation();
    if (!location) {
      throw new Error('Location not available');
    }

    const response = await fetch('/api/push/notify-campaign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId: 'test-notification',
        center: location,
        radiusMeters: 100 // Small radius for test
      })
    });

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}

/**
 * Complete push notification setup
 */
export async function setupPushNotifications(userId?: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    // Request permission
    const permission = await requestPermission();
    if (!permission.granted) {
      return { success: false, error: 'Notification permission denied' };
    }

    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      return { success: false, error: 'Failed to get FCM token' };
    }

    // Get location with rationale
    const location = await getGeoLocation({ showRationale: true });

    // Register token with backend
    const tokenData: PushTokenData = {
      token,
      userId,
      lat: location?.lat,
      lng: location?.lng
    };

    const registered = await registerPushToken(tokenData);
    if (!registered) {
      return { success: false, error: 'Failed to register token with backend' };
    }

    return { success: true, token };
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}










