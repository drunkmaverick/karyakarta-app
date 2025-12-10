import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { Campaign } from '../_types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const useMock = process.env.USE_MOCK === '1';

    if (useMock) {
      // Mock data for testing
      const campaign: Campaign = {
        id: id,
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
      };

      return NextResponse.json({
        success: true,
        campaign
      });
    }

    // Real Firestore implementation
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }
    
    const doc = await db.collection('campaigns').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    const campaign: Campaign = {
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

    return NextResponse.json({
      success: true,
      campaign
    });

  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}