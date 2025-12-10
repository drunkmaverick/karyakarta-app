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
        samples: {
          campaigns: [],
          jobs: [],
          pushTokens: []
        },
        counts: {
          campaigns: 0,
          jobs: 0,
          pushTokens: 0
        },
        message: 'Self-check skipped in mock mode'
      });
    }

    if (!db) {
      return NextResponse.json({
        ok: false,
        error: 'Firebase Admin DB not available',
        useMock: false
      }, { status: 503 });
    }

    // Test Firestore reads with current indexes
    const results = await Promise.allSettled([
      // Test campaigns collection
      db.collection('campaigns').limit(1).get(),
      // Test jobs collection
      db.collection('jobs').limit(1).get(),
      // Test pushTokens collection
      db.collection('pushTokens').limit(1).get()
    ]);

    const [campaignsResult, jobsResult, pushTokensResult] = results;

    const samples = {
      campaigns: campaignsResult.status === 'fulfilled' ? campaignsResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() })) : [],
      jobs: jobsResult.status === 'fulfilled' ? jobsResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() })) : [],
      pushTokens: pushTokensResult.status === 'fulfilled' ? pushTokensResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() })) : []
    };

    // Get counts
    const countResults = await Promise.allSettled([
      db.collection('campaigns').count().get(),
      db.collection('jobs').count().get(),
      db.collection('pushTokens').count().get()
    ]);

    const counts = {
      campaigns: countResults[0].status === 'fulfilled' ? countResults[0].value.data().count : 0,
      jobs: countResults[1].status === 'fulfilled' ? countResults[1].value.data().count : 0,
      pushTokens: countResults[2].status === 'fulfilled' ? countResults[2].value.data().count : 0
    };

    const errors = [];
    if (campaignsResult.status === 'rejected') {
      errors.push(`Campaigns: ${campaignsResult.reason.message}`);
    }
    if (jobsResult.status === 'rejected') {
      errors.push(`Jobs: ${jobsResult.reason.message}`);
    }
    if (pushTokensResult.status === 'rejected') {
      errors.push(`PushTokens: ${pushTokensResult.reason.message}`);
    }

    return NextResponse.json({
      ok: true,
      useMock: false,
      samples,
      counts,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Self-check error:', error);
    return NextResponse.json({
      ok: false,
      useMock: process.env.USE_MOCK === '1',
      error: error.message || 'Self-check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}













