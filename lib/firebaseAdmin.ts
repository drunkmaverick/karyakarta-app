import * as admin from 'firebase-admin';

// Check if we should use mock mode
const useMock = process.env.USE_MOCK === '1';

if (!admin.apps.length) {
  if (useMock) {
    console.log('Running in MOCK mode - Firebase operations will be simulated');
  } else {
    let credential;
    
    // Try environment variables first, then service account file, then default credentials
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
        console.log('Firebase Admin initialized with environment variables');
      } catch (error) {
        console.error('Failed to initialize Firebase with environment variables:', error);
        throw new Error('Invalid Firebase credentials in environment variables');
      }
    } else {
      try {
        // Try to load service account file if it exists
        const fs = require('fs');
        const path = require('path');
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccount.json');
        
        if (fs.existsSync(serviceAccountPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          credential = admin.credential.cert(serviceAccount);
          console.log('Firebase Admin initialized with service account file');
        } else {
          throw new Error('Service account file not found');
        }
      } catch (error) {
        try {
          // Fall back to application default credentials
          credential = admin.credential.applicationDefault();
          console.log('Firebase Admin initialized with application default credentials');
        } catch (defaultError) {
          console.error('Failed to initialize Firebase with any credential method:', defaultError);
          throw new Error('Firebase credentials not found. Please set environment variables or provide serviceAccount.json');
        }
      }
    }
    
    try {
      admin.initializeApp({
        credential,
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw new Error('Firebase Admin initialization failed');
    }
  }
}

// Only initialize Firebase services if not in mock mode
export const db = useMock ? null : admin.firestore();
export const auth = useMock ? null : admin.auth();
export const messaging = useMock ? null : admin.messaging();

// Add helper function to check if Firebase is available
export const isFirebaseAvailable = () => !useMock && admin.apps.length > 0;

// Helper function to check if required services are available in real mode
export const checkFirebaseServices = () => {
  if (useMock) {
    return { available: true, mode: 'mock' };
  }
  
  if (!admin.apps.length) {
    return { available: false, mode: 'real', error: 'Firebase not initialized' };
  }
  
  return { 
    available: true, 
    mode: 'real',
    firestore: db !== null,
    auth: auth !== null,
    messaging: messaging !== null
  };
};
