import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireCustomer } from '../../_lib/requireAuth';
import {
  CreateCampaignRequest,
  CreateCampaignResponse,
} from '../../../../src/types/cleanup';
import {
  getCleanupCampaignsCollection,
  getCampaignParticipantsCollection,
  getPaymentIntentsCollection,
  createCleanupCampaignData,
  createCampaignParticipantData,
  createPaymentIntentData,
} from '../../../../src/lib/cleanup/helpers';
import { calculatePrice, rupeesToPaise } from '../../../../src/lib/cleanup/pricing';
import { Timestamp } from 'firebase-admin/firestore';
import { createOrder } from '../../../../lib/payments';
import { paymentsEnabled } from '../../../../src/lib/flags';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateCampaignResponse>> {
  try {
    const authResult = await requireCustomer(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<CreateCampaignResponse>;
    }

    const {
      title,
      description,
      location,
      scheduledDate,
    }: CreateCampaignRequest = await request.json();

    // Validate required fields
    if (!title || !location?.lat || !location?.lng || !scheduledDate) {
      return NextResponse.json(
        { ok: false, error: 'Title, location (lat/lng), and scheduledDate are required' },
        { status: 400 }
      );
    }

    // Validate location coordinates
    if (
      typeof location.lat !== 'number' ||
      typeof location.lng !== 'number' ||
      location.lat < -90 ||
      location.lat > 90 ||
      location.lng < -180 ||
      location.lng > 180
    ) {
      return NextResponse.json(
        { ok: false, error: 'Invalid location coordinates' },
        { status: 400 }
      );
    }

    // Validate scheduled date is in the future
    const scheduled = new Date(scheduledDate);
    if (isNaN(scheduled.getTime()) || scheduled <= new Date()) {
      return NextResponse.json(
        { ok: false, error: 'Scheduled date must be in the future' },
        { status: 400 }
      );
    }

    const USE_MOCK = process.env.USE_MOCK === '1';

    if (USE_MOCK) {
      // Mock mode - return mock campaign ID
      const mockCampaignId = `mock_campaign_${Date.now()}`;
      return NextResponse.json({
        ok: true,
        campaignId: mockCampaignId,
      });
    }

    // Check database availability
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Create campaign document
    const campaignData = createCleanupCampaignData(
      authResult.uid,
      title,
      location,
      Timestamp.fromDate(scheduled),
      description
    );

    const campaignRef = getCleanupCampaignsCollection(db).doc();
    const campaignId = campaignRef.id;

    // Create payment intent for creator (they join automatically)
    // Price for first participant (creator) is base price
    const creatorPrice = calculatePrice(1); // ₹649
    const amountInPaise = rupeesToPaise(creatorPrice);

    let razorpayOrderId: string | undefined;
    let paymentIntentId: string | undefined;

    if (paymentsEnabled) {
      try {
        // Create Razorpay order (HOLD only, not captured yet)
        const order = await createOrder({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `cleanup_${campaignId}_${Date.now()}`,
          notes: {
            campaignId,
            userId: authResult.uid,
            type: 'cleanup_creation',
          },
        });
        razorpayOrderId = order.id;
      } catch (paymentError: any) {
        console.error('Error creating Razorpay order:', paymentError);
        // Continue without payment for now (TODO: Phase 2 - proper error handling)
      }
    } else {
      // Payments disabled - use mock order ID
      razorpayOrderId = `mock_order_${Date.now()}`;
    }

    // Create payment intent document
    const paymentIntentRef = getPaymentIntentsCollection(db).doc();
    paymentIntentId = paymentIntentRef.id;

    const paymentIntentData = createPaymentIntentData(
      authResult.uid,
      campaignId,
      amountInPaise,
      razorpayOrderId
    );

    // Use batch write for atomicity
    const batch = db.batch();

    // Create campaign
    batch.set(campaignRef, {
      ...campaignData,
      id: campaignId,
    });

    // Create payment intent
    batch.set(paymentIntentRef, {
      ...paymentIntentData,
      id: paymentIntentId,
    });

    // Create participant document for creator
    const participantData = createCampaignParticipantData(
      authResult.uid,
      campaignId,
      paymentIntentId,
      creatorPrice // Amount in rupees
    );

    const participantRef = getCampaignParticipantsCollection(db, campaignId).doc(
      authResult.uid
    );
    batch.set(participantRef, participantData);

    // Update campaign participant count
    batch.update(campaignRef, {
      participantCount: 1, // Creator is first participant
      currentPrice: creatorPrice,
    });

    await batch.commit();

    return NextResponse.json({
      ok: true,
      campaignId,
    });
  } catch (error: any) {
    console.error('Error creating cleanup campaign:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

