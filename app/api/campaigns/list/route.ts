import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { Campaign } from '../_types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const useMock = process.env.USE_MOCK === '1';

    if (useMock) {
      // Mock data for testing
      const campaigns: Campaign[] = [
        {
          id: 'test-campaign-1',
          title: 'Test Campaign',
          description: 'A test campaign for development',
          areaName: 'Test Area',
          radiusKm: 2,
          center: { lat: 19.117, lng: 72.905 },
          imageUrl: 'https://example.com/test.jpg',
          afterImageUrl: 'https://example.com/test-after.jpg',
          status: 'live',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      return NextResponse.json({
        success: true,
        campaigns: campaigns.slice(0, limit)
      });
    }

    // Real Firestore implementation
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }
    
    const snapshot = await db.collection('campaigns')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const campaigns: Campaign[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        areaName: data.areaName,
        radiusKm: data.radiusKm,
        center: data.center,
        imageUrl: data.imageUrl,
        afterImageUrl: data.afterImageUrl,
        status: data.status || 'draft',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    return NextResponse.json({
      success: true,
      campaigns
    });

  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}