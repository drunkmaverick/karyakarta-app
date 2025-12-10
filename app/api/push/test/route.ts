import { NextRequest, NextResponse } from 'next/server';
import { db, messaging } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const useMock = process.env.USE_MOCK === '1';

    if (useMock) {
      // Mock response for testing
      return NextResponse.json({
        ok: true,
        sentCount: 1,
        message: 'Mock: Test notification sent successfully'
      });
    }

    if (!messaging) {
      return NextResponse.json(
        { ok: false, error: 'FCM not initialized' },
        { status: 500 }
      );
    }

    // Send test notification to single token
    const message = {
      notification: {
        title: '🧪 Test Notification',
        body: 'This is a test notification from KaryaKarta!',
      },
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
      token: token,
    };

    try {
      const response = await messaging.send(message);
      console.log('Test notification sent successfully:', response);
      
      return NextResponse.json({
        ok: true,
        sentCount: 1,
        message: 'Test notification sent successfully'
      });
    } catch (fcmError: any) {
      console.error('FCM test send error:', fcmError);
      
      // If token is invalid, try to remove it from database
      if (fcmError.code === 'messaging/invalid-registration-token' || 
          fcmError.code === 'messaging/registration-token-not-registered') {
        try {
          if (db) {
            const tokenQuery = await db.collection('pushTokens')
              .where('token', '==', token)
              .get();
            
            if (!tokenQuery.empty) {
              const deletePromises = tokenQuery.docs.map(doc => doc.ref.delete());
              await Promise.all(deletePromises);
              console.log('Removed invalid token from database');
            }
          }
        } catch (dbError) {
          console.error('Error removing invalid token:', dbError);
        }
      }
      
      return NextResponse.json(
        { ok: false, error: 'Failed to send test notification' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
















