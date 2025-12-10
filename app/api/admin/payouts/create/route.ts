import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/firebaseAdmin';
import { requireAdmin } from '../../../_lib/requireAdmin';
import { PayoutDoc } from '../../../../../src/types/app';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = requireAdmin(request);
    if (authResult) {
      return authResult;
    }

    const { providerId, transactionIds, totalAmount, notes } = await request.json();

    // Validate required fields
    if (!providerId || !transactionIds || !Array.isArray(transactionIds) || !totalAmount) {
      return NextResponse.json(
        { ok: false, error: 'Provider ID, transaction IDs, and total amount are required' },
        { status: 400 }
      );
    }

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    if (USE_MOCK) {
      // Mock mode - return success
      const mockPayoutId = `mock_payout_${Date.now()}`;
      return NextResponse.json({
        ok: true,
        payoutId: mockPayoutId,
        message: 'Payout created successfully (mock mode)'
      });
    }

    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Create payout document
    const payoutData: Omit<PayoutDoc, 'createdAt' | 'updatedAt'> = {
      providerId,
      jobId: '', // Will be set to first job ID or a summary
      amount: Number(totalAmount),
      status: 'draft',
      metadata: {
        transactionIds,
        notes: notes || '',
        createdBy: 'admin'
      }
    };

    const docRef = await db.collection('payouts').add({
      ...payoutData,
      jobId: `batch_${Date.now()}`, // Use batch ID for multiple transactions
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update transaction statuses to indicate they're part of a payout
    const batch = db.batch();
    for (const transactionId of transactionIds) {
      const transactionRef = db.collection('transactions').doc(transactionId);
      batch.update(transactionRef, {
        payoutId: docRef.id,
        updatedAt: new Date()
      });
    }
    await batch.commit();

    return NextResponse.json({
      ok: true,
      payoutId: docRef.id,
      message: 'Payout created successfully'
    });

  } catch (error: any) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









