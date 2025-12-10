import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { requireCustomer } from '../../_lib/requireAuth';
import { createOrder } from '../../../../lib/payments';
import { CreateTransactionRequest, CreateTransactionResponse, TransactionDoc } from '../../../../src/types/app';
import { paymentsEnabled } from '../../../../src/lib/flags';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse<CreateTransactionResponse>> {
  try {
    const authResult = await requireCustomer(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<CreateTransactionResponse>;
    }

    const {
      jobId,
      amount,
      currency = 'INR'
    }: CreateTransactionRequest = await request.json();

    // Validate required fields
    if (!jobId || !amount) {
      return NextResponse.json(
        { ok: false, error: 'Job ID and amount are required' },
        { status: 400 }
      );
    }

    if (!paymentsEnabled) {
      // Payments disabled - return mock transaction
      const mockTransactionId = `mock_transaction_${Date.now()}`;
      const mockOrderId = `mock_order_${Date.now()}`;
      
      return NextResponse.json({
        ok: true,
        transactionId: mockTransactionId,
        orderId: mockOrderId,
        amount,
        currency
      });
    }

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    if (USE_MOCK) {
      // Mock mode - return mock transaction
      const mockTransactionId = `mock_transaction_${Date.now()}`;
      const mockOrderId = `mock_order_${Date.now()}`;
      
      return NextResponse.json({
        ok: true,
        transactionId: mockTransactionId,
        orderId: mockOrderId,
        amount,
        currency
      });
    }

    // Check database availability for non-mock mode
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    // Verify job exists and belongs to customer
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const jobData = jobDoc.data()!;
    if (jobData.customerId !== authResult.uid) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create Razorpay order
    const order = await createOrder({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `job_${jobId}_${Date.now()}`,
      notes: {
        jobId,
        customerId: authResult.uid
      }
    });

    // Create transaction document
    const transactionData: Omit<TransactionDoc, 'createdAt' | 'updatedAt'> = {
      id: '', // Will be set after document creation
      jobId,
      amount,
      currency,
      status: 'pending',
      customerId: authResult.uid,
      paymentProvider: 'razorpay',
      providerOrderId: order.id,
      metadata: {
        orderReceipt: order.receipt
      }
    };

    const docRef = await db.collection('transactions').add({
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update transaction document with generated ID
    await docRef.update({ id: docRef.id });

    return NextResponse.json({
      ok: true,
      transactionId: docRef.id,
      orderId: order.id,
      amount,
      currency
    });

  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
