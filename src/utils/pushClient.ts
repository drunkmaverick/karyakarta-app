import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, deleteToken } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton instances
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase App in browser
 */
export function initFirebaseClient(): FirebaseApp | null {
  if (app) return app;

  // Check if required env vars are present
  const requiredEnvs = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  if (missingEnvs.length > 0) {
    console.warn('Missing Firebase environment variables:', missingEnvs);
    return null;
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    return app;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

/**
 * Get messaging instance
 */
export function getMessagingInstance(): Messaging | null {
  if (messaging) return messaging;

  if (!app) {
    app = initFirebaseClient();
    if (!app) return null;
  }

  try {
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.warn('Firebase messaging not supported:', error);
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as 'granted' | 'denied' | 'default';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Get FCM token
 */
export async function getFcmToken(): Promise<string | null> {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) {
    console.warn('Firebase messaging not available');
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
  if (!vapidKey) {
    console.warn('VAPID key not configured');
    return null;
  }

  try {
    const token = await getToken(messagingInstance, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Register token with server
 */
export async function registerTokenOnServer(
  token: string, 
  context?: { lat?: number; lng?: number; userId?: string; role?: string }
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/register-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        token,
        lat: context?.lat,
        lng: context?.lng,
        userId: context?.userId,
        role: context?.role || 'customer',
        ua: navigator.userAgent
      })
    });

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Error registering token:', error);
    return false;
  }
}

/**
 * Get Firebase Auth token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // This would need to be implemented based on your auth setup
    // For now, return null and let the API handle it
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Unregister token from server
 */
export async function unregisterTokenOnServer(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unregister-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('Error unregistering token:', error);
    return false;
  }
}

/**
 * Delete local token
 */
export async function deleteLocalToken(): Promise<void> {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return;

  try {
    await deleteToken(messagingInstance);
  } catch (error) {
    console.error('Error deleting local token:', error);
  }
}

/**
 * Ensure service worker bridge is set up
 */
export async function ensureServiceWorkerBridge(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service worker registered:', registration);

    // Send Firebase config to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig
      });
    }
  } catch (error) {
    console.error('Error registering service worker:', error);
  }
}

/**
 * Set up foreground message listener
 */
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) {
    console.warn('Firebase messaging not available');
    return () => {};
  }

  return onMessage(messagingInstance, callback);
}

/**
 * Get current location using browser geolocation API
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Check if we're in mock mode
 */
function isMockMode(): boolean {
  // Check both server-side and client-side mock flags
  return process.env.NEXT_PUBLIC_USE_MOCK === '1' || 
         (typeof window !== 'undefined' && (window as any).USE_MOCK === '1');
}

/**
 * Complete push notification setup
 */
export async function setupPushNotifications(context?: { lat?: number; lng?: number; userId?: string; role?: string }): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  mode?: 'mock' | 'real';
}> {
  try {
    const mockMode = isMockMode();
    
    if (mockMode) {
      console.log('Push notifications in MOCK mode');
      
      // Generate a mock token for testing
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate permission request
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'Notification permission denied', mode: 'mock' };
      }
      
      // Register mock token with backend
      const registered = await registerTokenOnServer(mockToken, context);
      if (!registered) {
        return { success: false, error: 'Failed to register mock token with backend', mode: 'mock' };
      }
      
      return { success: true, token: mockToken, mode: 'mock' };
    }

    // Real mode implementation
    // Initialize Firebase
    if (!initFirebaseClient()) {
      return { success: false, error: 'Firebase not configured', mode: 'real' };
    }

    // Ensure service worker is registered
    await ensureServiceWorkerBridge();

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied', mode: 'real' };
    }

    // Get FCM token
    const token = await getFcmToken();
    if (!token) {
      return { success: false, error: 'Failed to get FCM token', mode: 'real' };
    }

    // Register token with backend
    const registered = await registerTokenOnServer(token, context);
    if (!registered) {
      return { success: false, error: 'Failed to register token with backend', mode: 'real' };
    }

    return { success: true, token, mode: 'real' };
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      mode: isMockMode() ? 'mock' : 'real'
    };
  }
}
