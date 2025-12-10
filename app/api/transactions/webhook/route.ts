import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebaseAdmin';
import { verifyWebhookSignature, handleWebhookEvent } from '../../../../lib/payments';
import { WebhookEvent } from '../../../../src/types/app';
import { paymentsEnabled } from '../../../../src/lib/flags';

async function sendPaymentNotification(
  userType: 'customer' | 'provider',
  userId: string,
  notificationData: any
) {
  const USE_MOCK = process.env.USE_MOCK === '1';
  
  if (USE_MOCK) {
    console.log('Mock: Sending payment notification:', {
      userType,
      userId,
      data: notificationData
    });
    return;
  }
  
  if (!db) {
    throw new Error('Database not available');
  }
  
  // Get user's push tokens
  const tokensSnapshot = await db.collection('pushTokens')
    .where('userId', '==', userId)
    .where('role', '==', userType)
    .get();
  
  if (tokensSnapshot.empty) {
    console.log(`No push tokens found for ${userType}:`, userId);
    return;
  }
  
  const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
  
  // Send notification via existing push notification system
  const notificationPayload = {
    title: notificationData.type === 'payment_success' 
      ? 'Payment Successful!' 
      : 'Payment Received!',
    body: notificationData.type === 'payment_success'
      ? `Your payment of ₹${notificationData.amount} has been processed successfully.`
      : `You received a payment of ₹${notificationData.amount} for job ${notificationData.jobId}.`,
    data: notificationData,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png'
  };
  
  // Use existing push notification endpoint
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/push/notify-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        payload: notificationPayload
      })
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!paymentsEnabled) {
      // Payments disabled - simulate successful webhook processing
      console.log('Payments disabled: Simulating webhook processing');
      return NextResponse.json({ ok: true, mode: 'payments_disabled' });
    }

    const USE_MOCK = process.env.USE_MOCK === '1';
    
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET_TEST || '';
    
    // Verify webhook signature (skip in mock mode)
    if (!USE_MOCK && webhookSecret) {
      const isValidSignature = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { ok: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }
    
    // Parse webhook event
    const event: WebhookEvent = JSON.parse(rawBody);
    console.log('Received webhook event:', event.event);
    
    // Handle the webhook event
    const result = await handleWebhookEvent(event);
    
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }
    
    if (USE_MOCK) {
      // Mock mode - simulate database update
      console.log('Mock: Webhook processed successfully for transaction:', result.transactionId);
      return NextResponse.json({ ok: true, mode: 'mock' });
    }
    
    // Real mode - update database
    if (!db) {
      return NextResponse.json(
        { ok: false, error: 'Database not available' },
        { status: 500 }
      );
    }
    
    // Find transaction by providerOrderId or providerPaymentId
    let transactionDoc = null;
    let transactionId = null;
    
    if (event.payload.payment?.entity.order_id) {
      const orderId = event.payload.payment.entity.order_id;
      const transactionQuery = await db.collection('transactions')
        .where('providerOrderId', '==', orderId)
        .limit(1)
        .get();
      
      if (!transactionQuery.empty) {
        transactionDoc = transactionQuery.docs[0];
        transactionId = transactionDoc.id;
      }
    }
    
    if (!transactionDoc) {
      console.error('Transaction not found for webhook event');
      return NextResponse.json(
        { ok: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    const transactionData = transactionDoc.data();
    
    // Update transaction status based on event
    let newStatus = 'pending';
    if (event.event === 'payment.captured') {
      newStatus = 'succeeded';
    } else if (event.event === 'payment.failed') {
      newStatus = 'failed';
    }
    
    // Update transaction
    await transactionDoc.ref.update({
      status: newStatus,
      providerPaymentId: event.payload.payment?.entity.id || transactionData.providerPaymentId,
      updatedAt: new Date()
    });
    
    // Update job status if payment succeeded
    if (newStatus === 'succeeded') {
      const jobRef = db.collection('jobs').doc(transactionData.jobId);
      const jobDoc = await jobRef.get();
      
      if (jobDoc.exists) {
        const jobData = jobDoc.data()!;
        
        // Update job status
        await jobRef.update({
          status: 'paid',
          updatedAt: new Date()
        });
        
        console.log('Job status updated to paid for job:', transactionData.jobId);
        
        // Send push notifications
        try {
          // Notify customer about successful payment
          await sendPaymentNotification('customer', transactionData.customerId, {
            type: 'payment_success',
            amount: transactionData.amount,
            jobId: transactionData.jobId,
            transactionId: transactionId
          });
          
          // Notify provider if job is assigned
          if (jobData.providerId) {
            await sendPaymentNotification('provider', jobData.providerId, {
              type: 'payment_received',
              amount: transactionData.amount,
              jobId: transactionData.jobId,
              customerId: transactionData.customerId
            });
          }
          
          console.log('Push notifications sent for successful payment');
        } catch (notificationError) {
          console.error('Failed to send push notifications:', notificationError);
          // Don't fail the webhook if notifications fail
        }
      }
    }
    
    console.log('Webhook processed successfully for transaction:', transactionId);
    
    return NextResponse.json({ ok: true });
    
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
