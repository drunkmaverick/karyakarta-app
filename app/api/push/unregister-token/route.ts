import { NextRequest, NextResponse } from 'next/server';
import { db, checkFirebaseServices } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Token is required' }, { status: 400 });
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
      console.log('Mock: Unregistering push token:', { token: token.substring(0, 8) + '...' });
      return NextResponse.json({ 
        ok: true, 
        message: 'Token unregistered successfully (mock mode)',
        mode: 'mock'
      });
    }

    if (!db) {
      return NextResponse.json({ ok: false, error: 'Database not available' }, { status: 500 });
    }

    // Delete token from pushTokens collection
    const tokenQuery = await db.collection('pushTokens').where('token', '==', token).get();
    
    if (tokenQuery.empty) {
      return NextResponse.json({ ok: false, error: 'Token not found' }, { status: 404 });
    }

    // Delete all matching tokens (should be only one)
    const deletePromises = tokenQuery.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    return NextResponse.json({ 
      ok: true, 
      message: 'Token unregistered successfully',
      mode: 'real'
    });
  } catch (error) {
    console.error('Error unregistering token:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}


