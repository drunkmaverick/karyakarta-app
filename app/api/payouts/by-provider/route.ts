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

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Get payouts for this provider
    const payoutsSnapshot = await db.collection('payouts')
      .where('providerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const payouts = await Promise.all(payoutsSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // Get job details
      let jobDetails = null;
      if (data.jobId && db) {
        const jobDoc = await db.collection('jobs').doc(data.jobId).get();
        if (jobDoc.exists) {
          const jobData = jobDoc.data()!;
          
          // Get customer name
          let customerName = '';
          if (jobData.customerId) {
            const customerDoc = await db.collection('customers').doc(jobData.customerId).get();
            if (customerDoc.exists) {
              customerName = customerDoc.data()?.name || customerDoc.data()?.email || 'Unknown Customer';
            }
          }

          jobDetails = {
            service: jobData.service,
            scheduledAt: jobData.scheduledAt?.toDate?.()?.toISOString() || null,
            customerName
          };
        }
      }

      return {
        id: doc.id,
        jobId: data.jobId,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        job: jobDetails,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    }));

    // Calculate stats
    const stats = {
      totalPayouts: payouts.length,
      pendingAmount: payouts
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      completedAmount: payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      totalEarnings: payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)
    };

    return NextResponse.json({
      ok: true,
      payouts,
      stats
    });

  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}