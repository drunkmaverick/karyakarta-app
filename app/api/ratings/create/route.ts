import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { jobId, providerId, rating, comment } = await request.json();

    if (!jobId || !providerId || !rating) {
      return NextResponse.json(
        { ok: false, error: 'Job ID, provider ID, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: 'Rating must be between 1 and 5' },
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

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Verify the job exists and belongs to the user
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    
    if (!jobDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobDoc.data()!;

    if (job.customerId !== userId) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { ok: false, error: 'Can only rate completed jobs' },
        { status: 400 }
      );
    }

    // Check if rating already exists
    const existingRatingSnapshot = await db.collection('job_ratings')
      .where('jobId', '==', jobId)
      .where('customerId', '==', userId)
      .limit(1)
      .get();

    if (!existingRatingSnapshot.empty) {
      return NextResponse.json(
        { ok: false, error: 'Job already rated' },
        { status: 400 }
      );
    }

    // Create rating
    const ratingData = {
      jobId,
      customerId: userId,
      providerId,
      rating: Number(rating),
      comment: comment?.trim() || null,
      createdAt: new Date()
    };

    await db.collection('job_ratings').add(ratingData);

    // Update provider's average rating
    await updateProviderRating(providerId);

    return NextResponse.json({
      ok: true,
      message: 'Rating submitted successfully'
    });

  } catch (error: any) {
    console.error('Error creating rating:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateProviderRating(providerId: string) {
  try {
    if (!db) return;
    
    // Get all ratings for this provider
    const ratingsSnapshot = await db.collection('job_ratings')
      .where('providerId', '==', providerId)
      .get();

    if (ratingsSnapshot.empty) return;

    const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating);
    const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const ratingCount = ratings.length;

    // Update provider document
    await db.collection('providers').doc(providerId).update({
      ratingAvg: averageRating,
      ratingCount,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating provider rating:', error);
    // Don't throw error as this is not critical
  }
}

