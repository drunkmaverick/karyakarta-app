import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireCustomer } from '../../_lib/requireAuth';
import {
  JoinCampaignRequest,
  JoinCampaignResponse,
} from '../../../../src/types/cleanup';
import {
  getCleanupCampaignRef,
  getCampaignParticipantsCollection,
  getPaymentIntentsCollection,
  createCampaignParticipantData,
  createPaymentIntentData,
  canJoinCampaign,
} from '../../../../src/lib/cleanup/helpers';
import { calculateNextPrice, rupeesToPaise } from '../../../../src/lib/cleanup/pricing';
import { Timestamp } from 'firebase-admin/firestore';
import { createOrder } from '../../../../lib/payments';
import { paymentsEnabled } from '../../../../src/lib/flags';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest
): Promise<NextResponse<JoinCampaignResponse>> {
  try {
    const authResult = await requireCustomer(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<JoinCampaignResponse>;
    }

    const { campaignId, paymentMethod = 'razorpay' }: JoinCampaignRequest =
      await request.json();

    // Validate required fields
    if (!campaignId) {
      return NextResponse.json(
        { ok: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const USE_MOCK = process.env.USE_MOCK === '1';

    if (USE_MOCK) {
      // Mock mode - return mock participant and order IDs
      return NextResponse.json({
        ok: true,
        participantId: `mock_participant_${Date.now()}`,
        paymentIntentId: `mock_payment_intent_${Date.now()}`,
        razorpayOrderId: `mock_order_${Date.now()}`,
      });
    }

    // Check database availability
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Use transaction for atomic join operation
    // TypeScript assertion: db is checked above, but we need to assert for transaction
    const dbNonNull = db as NonNullable<typeof db>;
    const result = await dbNonNull.runTransaction(async (transaction) => {
      // Fetch campaign
      const campaignRef = getCleanupCampaignRef(dbNonNull, campaignId);
      const campaignDoc = await transaction.get(campaignRef);

      if (!campaignDoc.exists) {
        throw new Error('Campaign not found');
      }

      const campaign = campaignDoc.data()!;

      // Validate campaign state - must be 'forming' to join
      if (!canJoinCampaign(campaign)) {
        throw new Error(
          `Campaign is not accepting new participants. Current state: ${campaign.campaignState}`
        );
      }

      // Check if user already joined
      const participantRef = getCampaignParticipantsCollection(dbNonNull, campaignId).doc(
        authResult.uid
      );
      const participantDoc = await transaction.get(participantRef);

      if (participantDoc.exists) {
        const existingParticipant = participantDoc.data()!;
        if (existingParticipant.status === 'active') {
          throw new Error('User has already joined this campaign');
        }
      }

      // Calculate new price for this participant
      const newParticipantCount = campaign.participantCount + 1;
      const newPrice = calculateNextPrice(campaign.participantCount);
      const amountInPaise = rupeesToPaise(newPrice);

      // Create Razorpay order (HOLD only, not captured yet)
      let razorpayOrderId: string | undefined;
      if (paymentsEnabled) {
        try {
          const order = await createOrder({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `cleanup_${campaignId}_${authResult.uid}_${Date.now()}`,
            notes: {
              campaignId,
              userId: authResult.uid,
              type: 'cleanup_join',
            },
          });
          razorpayOrderId = order.id;
        } catch (paymentError: any) {
          console.error('Error creating Razorpay order:', paymentError);
          throw new Error('Failed to create payment order');
        }
      } else {
        // Payments disabled - use mock order ID
        razorpayOrderId = `mock_order_${Date.now()}`;
      }

      // Create payment intent document
      const paymentIntentData = createPaymentIntentData(
        authResult.uid,
        campaignId,
        amountInPaise,
        razorpayOrderId
      );

      const paymentIntentRef = getPaymentIntentsCollection(dbNonNull).doc();
      const paymentIntentId = paymentIntentRef.id;

      // Create participant document
      const participantData = createCampaignParticipantData(
        authResult.uid,
        campaignId,
        paymentIntentId,
        newPrice // Amount in rupees
      );

      // Update documents in transaction
      transaction.set(paymentIntentRef, {
        ...paymentIntentData,
        id: paymentIntentId,
      });

      transaction.set(participantRef, participantData);

      // Update campaign: increment participant count and update price
      transaction.update(campaignRef, {
        participantCount: newParticipantCount,
        currentPrice: newPrice,
        updatedAt: Timestamp.now(),
      });

      return {
        participantId: authResult.uid,
        paymentIntentId,
        razorpayOrderId: razorpayOrderId!,
      };
    });

    return NextResponse.json({
      ok: true,
      participantId: result.participantId,
      paymentIntentId: result.paymentIntentId,
      razorpayOrderId: result.razorpayOrderId,
    });
  } catch (error: any) {
    console.error('Error joining cleanup campaign:', error);
    
    // Return appropriate error status
    if (error.message === 'Campaign not found') {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 404 }
      );
    }
    
    if (
      error.message.includes('already joined') ||
      error.message.includes('not accepting new participants')
    ) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

