// Client-side Firebase init
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const appClient = getApps().length ? getApps()[0] : initializeApp(config);
export const auth = getAuth(appClient);
export const db = getFirestore(appClient);

// Initialize messaging
let messaging: any = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(appClient);
  } catch (error) {
    console.warn('Firebase messaging not available:', error);
  }
}

export { messaging };

// Helper function to request notification permission and get token
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('Messaging not available');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VAPID key not configured');
        return null;
      }
      
      const token = await getToken(messaging, { vapidKey });
      return token;
    } else {
      console.warn('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
}

// Helper function to listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {};
  
  return onMessage(messaging, callback);
}