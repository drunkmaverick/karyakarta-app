import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/firebaseAdmin';
import { requireAdmin } from '../../../_lib/requireAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAdmin(request);
    if (authResult) {
      return authResult;
    }

    const { payoutId, paymentMethod, notes } = await request.json();

    // Validate required fields
    if (!payoutId) {
      return NextResponse.json(
        { ok: false, error: 'Payout ID is required' },
        { status: 400 }
      );
    }

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    if (USE_MOCK) {
      // Mock mode - return success
      return NextResponse.json({
        ok: true,
        message: 'Payout marked as paid (mock mode)'
      });
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Update payout status
    const payoutRef = db.collection('payouts').doc(payoutId);
    await payoutRef.update({
      status: 'completed',
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentNotes: notes || '',
      paidAt: new Date(),
      updatedAt: new Date()
    });

    // Update related transactions to mark them as settled
    const payoutDoc = await payoutRef.get();
    if (payoutDoc.exists) {
      const payoutData = payoutDoc.data()!;
      const transactionIds = payoutData.metadata?.transactionIds || [];
      
      if (transactionIds.length > 0) {
        const batch = db.batch();
        for (const transactionId of transactionIds) {
          const transactionRef = db.collection('transactions').doc(transactionId);
          batch.update(transactionRef, {
            status: 'settled',
            updatedAt: new Date()
          });
        }
        await batch.commit();
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Payout marked as paid successfully'
    });

  } catch (error: any) {
    console.error('Error marking payout as paid:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









