import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { getCleanupCampaignRef, getCampaignParticipantsCollection } from '../../../../src/lib/cleanup/helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params;

    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const USE_MOCK = process.env.USE_MOCK === '1';

    if (USE_MOCK) {
      // Mock mode - return mock campaign
      return NextResponse.json({
        ok: true,
        campaign: {
          id: campaignId,
          title: 'Mock Campaign',
          description: 'Mock campaign for testing',
          location: { lat: 28.6139, lng: 77.2090 },
          scheduledDate: new Date().toISOString(),
          currentPrice: 649,
          participantCount: 1,
          campaignState: 'forming',
        },
        participantCount: 1,
        currentPrice: 649,
      });
    }

    // Check database availability
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Fetch campaign
    const campaignRef = getCleanupCampaignRef(db, campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaignData = campaignDoc.data()!;

    // Convert Firestore Timestamp to ISO string
    const scheduledDate =
      campaignData.scheduledDate instanceof Date
        ? campaignData.scheduledDate.toISOString()
        : campaignData.scheduledDate?.toDate?.()?.toISOString() ||
          new Date().toISOString();

    // Return campaign data
    return NextResponse.json({
      ok: true,
      campaign: {
        id: campaignId,
        title: campaignData.title,
        description: campaignData.description,
        location: campaignData.location,
        scheduledDate,
        currentPrice: campaignData.currentPrice,
        participantCount: campaignData.participantCount,
        campaignState: campaignData.campaignState,
        createdBy: campaignData.createdBy,
        basePrice: campaignData.basePrice,
        floorPrice: campaignData.floorPrice,
      },
      participantCount: campaignData.participantCount,
      currentPrice: campaignData.currentPrice,
    });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

