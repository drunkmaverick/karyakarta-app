import { NextRequest, NextResponse } from 'next/server';
import { auth, db, checkFirebaseServices } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token, userId, role, lat, lng, ua } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const useMock = process.env.USE_MOCK === '1';
    const services = checkFirebaseServices();

    if (!services.available) {
      return NextResponse.json(
        { ok: false, error: `Firebase not available: ${services.error || 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (useMock) {
      // Mock mode - just return success
      console.log('Mock: Registering push token:', { token: token.substring(0, 8) + '...', userId, role, lat, lng });
      return NextResponse.json({ 
        ok: true, 
        message: 'Token registered successfully (mock mode)',
        mode: 'mock'
      });
    }

    // Real mode - require authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For guest users, allow registration without auth
      const finalUserId = userId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const finalRole = role || 'customer';

      if (!db) {
        return NextResponse.json(
          { ok: false, error: 'Database not available' },
          { status: 500 }
        );
      }

      // Check if token already exists
      const existingTokenSnapshot = await db.collection('pushTokens')
        .where('token', '==', token)
        .limit(1)
        .get();

      const tokenData = {
        token,
        userId: finalUserId,
        role: finalRole,
        lat: lat || null,
        lng: lng || null,
        ua: ua || null,
        updatedAt: new Date(),
      };

      if (existingTokenSnapshot.empty) {
        // Create new push token document
        await db.collection('pushTokens').add({
          ...tokenData,
          createdAt: new Date(),
        });
      } else {
        // Update existing token
        const existingToken = existingTokenSnapshot.docs[0];
        await existingToken.ref.update(tokenData);
      }

      return NextResponse.json({ 
        ok: true, 
        message: 'Token registered successfully (guest mode)',
        mode: 'real'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    let decodedToken;
    try {
      decodedToken = await auth!.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const verifiedUserId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Use provided userId or fallback to verified token uid
    const finalUserId = userId || verifiedUserId;
    const finalRole = role || 'customer';

    // Check if token already exists
    const existingTokenSnapshot = await db!.collection('pushTokens')
      .where('token', '==', token)
      .limit(1)
      .get();

    const tokenData = {
      token,
      userId: finalUserId,
      role: finalRole,
      lat: lat || null,
      lng: lng || null,
      ua: ua || null,
      updatedAt: new Date(),
    };

    if (existingTokenSnapshot.empty) {
      // Create new push token document
      await db!.collection('pushTokens').add({
        ...tokenData,
        createdAt: new Date(),
      });
    } else {
      // Update existing token
      const existingToken = existingTokenSnapshot.docs[0];
      await existingToken.ref.update(tokenData);
    }

    // Also ensure customer document exists
    const customerRef = db!.collection('customers').doc(finalUserId);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      await customerRef.set({
        email: userEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Token registered successfully',
      mode: 'real'
    });

  } catch (error: any) {
    console.error('Error registering FCM token:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

