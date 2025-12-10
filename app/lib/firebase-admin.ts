import { getApps, initializeApp, applicationDefault, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

function buildOptions(): AppOptions {
  if (isEmulator) {
    // Using Firestore emulator: NO credentials; just set projectId
    return {
      projectId:
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        'demo-project',
    };
  }

  const hasSA =
    !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY;

  if (hasSA) {
    return {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    };
  }

  // Fallback for deployed envs with ADC
  return {
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  };
}

const app = getApps()[0] ?? initializeApp(buildOptions());
export const dbAdmin = getFirestore(app);
export const authAdmin = getAuth(app);

// Legacy exports for backward compatibility
export const db = dbAdmin;
export const auth = authAdmin;
