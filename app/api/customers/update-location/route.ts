import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'Valid latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { ok: false, error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: 'Authentication not available' },
        { status: 500 }
      );
    }
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Update customer document with location
    const customerRef = db.collection('customers').doc(userId);
    const customerDoc = await customerRef.get();

    const locationData = {
      lat,
      lng,
      updatedAt: new Date(),
    };

    if (!customerDoc.exists) {
      // Create customer if doesn't exist
      await customerRef.set({
        email: userEmail,
        lastKnownLocation: locationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update existing customer with location
      await customerRef.update({
        lastKnownLocation: locationData,
        updatedAt: new Date(),
      });
    }

    // Also update location in pushTokens collection for targeting
    const pushTokensSnapshot = await db.collection('pushTokens')
      .where('uid', '==', userId)
      .get();

    const updatePromises = pushTokensSnapshot.docs.map(doc => 
      doc.ref.update({
        lat,
        lng,
        updatedAt: new Date(),
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      ok: true, 
      message: 'Location updated successfully',
      location: { lat, lng }
    });

  } catch (error: any) {
    console.error('Error updating customer location:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

