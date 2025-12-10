import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { db } from '../../../../lib/firebaseAdmin';
import { CreateCampaignRequest } from '../_types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminCheck = requireAdmin(request);
    if (adminCheck) return adminCheck;

    const body: any = await request.json();

    // Handle different field formats
    const title = body.title;
    const description = body.description || 'No description provided';
    const areaName = body.area?.name || body.areaName || 'Unknown Area';
    const radiusKm = (body.area?.radiusMeters || body.radiusKm || 2000) / 1000; // Convert meters to km
    const center = body.area?.lat && body.area?.lng ? 
      { lat: Number(body.area.lat), lng: Number(body.area.lng) } :
      body.center ? 
      { lat: Number(body.center.lat), lng: Number(body.center.lng) } :
      { lat: 19.117, lng: 72.905 }; // Default to Mumbai

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    const campaignData = {
      title,
      description,
      areaName,
      radiusKm: Number(radiusKm),
      center,
      imageUrl: body.images?.before || body.imageUrl || null,
      afterImageUrl: body.images?.after || body.afterImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const useMock = process.env.USE_MOCK === '1';

    if (useMock) {
      // Mock creation for testing
      const mockId = 'campaign-' + Date.now();
      
      return NextResponse.json({
        success: true,
        id: mockId,
        message: 'Campaign created successfully'
      });
    }

    // Real Firestore implementation
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }
    
    const docRef = await db.collection('campaigns').add(campaignData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Campaign created successfully'
    });

  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}