import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/firebaseAdmin';

export async function requireCustomer(request: NextRequest): Promise<{ uid: string; email?: string } | NextResponse> {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { ok: false, error: 'Authorization token required' },
      { status: 401 }
    );
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  // Check if we're in mock mode
  const USE_MOCK = process.env.USE_MOCK === '1';
  
  if (USE_MOCK) {
    // Mock mode - return mock user data
    return {
      uid: 'mock-user-id',
      email: 'mock@example.com'
    };
  }
  
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

  return {
    uid: decodedToken.uid,
    email: decodedToken.email
  };
}

export async function requireProvider(request: NextRequest): Promise<{ uid: string; email?: string } | NextResponse> {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { ok: false, error: 'Authorization token required' },
      { status: 401 }
    );
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  // Check if we're in mock mode
  const USE_MOCK = process.env.USE_MOCK === '1';
  
  if (USE_MOCK) {
    // Mock mode - return mock user data
    return {
      uid: 'mock-provider-id',
      email: 'mock-provider@example.com'
    };
  }
  
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

  return {
    uid: decodedToken.uid,
    email: decodedToken.email
  };
}

