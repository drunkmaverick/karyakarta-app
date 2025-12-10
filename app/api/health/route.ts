import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const useMock = process.env.USE_MOCK === '1';
    
    if (useMock) {
      return NextResponse.json({
        ok: true,
        useMock: true,
        projectId: process.env.FIREBASE_PROJECT_ID || 'karyakarta-app',
        hasMessaging: false,
        timestamp: new Date().toISOString(),
        environment: 'mock',
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID || 'karyakarta-app',
          messagingAvailable: false,
          firestoreAvailable: false
        }
      });
    }

    // Real mode - check Firebase services
    let firebaseStatus = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'unknown',
      messagingAvailable: false,
      firestoreAvailable: false
    };

    let firestoreError = '';
    let fcmError = '';

    try {
      // Check Firestore
      if (db) {
        await db.collection('_health').limit(1).get();
        firebaseStatus.firestoreAvailable = true;
      } else {
        firestoreError = 'Firebase Admin DB not initialized - check FIREBASE_PROJECT_ID and service account credentials';
      }
    } catch (error: any) {
      firestoreError = `Firestore connection failed: ${error.message}`;
      console.error('Firestore health check failed:', error);
    }

    try {
      // Check FCM (messaging)
      const messaging = require('firebase-admin/messaging');
      if (messaging) {
        firebaseStatus.messagingAvailable = true;
      } else {
        fcmError = 'FCM module not available - check firebase-admin installation';
      }
    } catch (error: any) {
      fcmError = `FCM initialization failed: ${error.message}`;
      console.error('FCM health check failed:', error);
    }

    const isHealthy = firebaseStatus.firestoreAvailable && firebaseStatus.messagingAvailable;

    if (!isHealthy) {
      const diagnosis = [];
      if (!firebaseStatus.firestoreAvailable) {
        diagnosis.push(`Firestore: ${firestoreError}`);
      }
      if (!firebaseStatus.messagingAvailable) {
        diagnosis.push(`FCM: ${fcmError}`);
      }
      
      return NextResponse.json({
        ok: false,
        useMock: false,
        projectId: firebaseStatus.projectId,
        hasMessaging: firebaseStatus.messagingAvailable,
        timestamp: new Date().toISOString(),
        environment: 'production',
        firebase: firebaseStatus,
        error: 'Firebase services not available',
        diagnosis: diagnosis,
        requiredEnvVars: [
          'FIREBASE_PROJECT_ID',
          'FIREBASE_PRIVATE_KEY',
          'FIREBASE_CLIENT_EMAIL'
        ]
      }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      useMock: false,
      projectId: firebaseStatus.projectId,
      hasMessaging: firebaseStatus.messagingAvailable,
      timestamp: new Date().toISOString(),
      environment: 'production',
      firebase: firebaseStatus
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      ok: false,
      useMock: process.env.USE_MOCK === '1',
      projectId: process.env.FIREBASE_PROJECT_ID || 'unknown',
      hasMessaging: false,
      timestamp: new Date().toISOString(),
      environment: process.env.USE_MOCK === '1' ? 'mock' : 'production',
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || 'unknown',
        messagingAvailable: false,
        firestoreAvailable: false
      },
      error: error.message || 'Health check failed'
    }, { status: 500 });
  }
}