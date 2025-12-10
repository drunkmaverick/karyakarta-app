import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType') || 'customer'; // customer or provider

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    let query;
    if (userType === 'customer') {
      query = db!.collection('jobs').where('customerId', '==', userId);
    } else {
      query = db!.collection('jobs').where('providerId', '==', userId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const jobs = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // Get customer details
      let customer = null;
      if (data.customerId) {
        try {
          const customerDoc = await db!.collection('customers').doc(data.customerId).get();
          if (customerDoc.exists) {
            customer = { id: customerDoc.id, ...customerDoc.data() };
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
        }
      }
      
      // Get provider details
      let provider = null;
      if (data.providerId) {
        try {
          const providerDoc = await db!.collection('providers').doc(data.providerId).get();
          if (providerDoc.exists) {
            provider = { id: providerDoc.id, ...providerDoc.data() };
          }
        } catch (error) {
          console.error('Error fetching provider:', error);
        }
      }
      
      return {
        id: doc.id,
        ...data,
        customer,
        provider,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledAt: data.scheduledAt?.toDate() || new Date(),
      };
    }));

    return NextResponse.json({ 
      ok: true, 
      jobs 
    });

  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}