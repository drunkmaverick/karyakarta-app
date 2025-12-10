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

    // Get provider document
    const providerDoc = await db.collection('providers').doc(userId).get();
    
    if (!providerDoc.exists) {
      // Create provider document if it doesn't exist
      await db.collection('providers').doc(userId).set({
        name: decodedToken.name || decodedToken.email,
        email: decodedToken.email,
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Get job statistics
    const jobsSnapshot = await db.collection('jobs')
      .where('providerId', '==', userId)
      .get();

    const jobs = jobsSnapshot.docs.map(doc => doc.data());
    
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const pendingJobs = jobs.filter(job => ['created', 'pending', 'in_progress'].includes(job.status)).length;
    
    const totalEarnings = jobs
      .filter(job => job.status === 'completed')
      .reduce((sum, job) => sum + (job.amount || 0), 0);

    // Get average rating from provider document
    const providerData = providerDoc.exists ? providerDoc.data() : { ratingAvg: 0, ratingCount: 0 };
    const averageRating = providerData?.ratingAvg || 0;

    const stats = {
      totalJobs,
      completedJobs,
      pendingJobs,
      totalEarnings,
      averageRating
    };

    return NextResponse.json({
      ok: true,
      stats
    });

  } catch (error: any) {
    console.error('Error fetching provider stats:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

