import { WebhookEvent } from '../src/types/app';
import { paymentsEnabled } from '../src/lib/flags';

let razorpayInstance: any = null;

export async function initRazorpay(): Promise<any | null> {
  if (!paymentsEnabled) {
    console.log('Payments disabled - Razorpay operations will be simulated');
    return null;
  }

  const USE_MOCK = process.env.USE_MOCK === '1';
  
  if (USE_MOCK) {
    console.log('Running in MOCK mode - Razorpay operations will be simulated');
    return null;
  }
  
  const keyId = process.env.RAZORPAY_KEY_ID_TEST;
  const keySecret = process.env.RAZORPAY_KEY_SECRET_TEST;
  
  if (!keyId || !keySecret) {
    const errorMsg = 'Razorpay credentials not found in environment variables. Please set RAZORPAY_KEY_ID_TEST and RAZORPAY_KEY_SECRET_TEST when payments are enabled.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  if (!razorpayInstance) {
    const Razorpay = (await import('razorpay')).default;
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  
  return razorpayInstance;
}

export interface CreateOrderParams {
  amount: number;
  currency: string;
  receipt: string;
  notes?: any;
}

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  if (!paymentsEnabled) {
    // Payments disabled - return mock order
    const mockOrderId = `mock_order_${Date.now()}`;
    return {
      id: mockOrderId,
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt
    };
  }

  const USE_MOCK = process.env.USE_MOCK === '1';
  
  if (USE_MOCK) {
    // Mock mode - return mock order
    const mockOrderId = `mock_order_${Date.now()}`;
    return {
      id: mockOrderId,
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt
    };
  }
  
  const razorpay = await initRazorpay();
  if (!razorpay) {
    throw new Error('Razorpay not initialized');
  }
  
  const orderParams = {
    amount: params.amount, // Amount in paise
    currency: params.currency,
    receipt: params.receipt,
    payment_capture: 1,
    notes: params.notes || {}
  };
  
  try {
    const order = await razorpay.orders.create(orderParams);
    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || ''
    };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!paymentsEnabled) {
    // Payments disabled - always return true
    return true;
  }

  const USE_MOCK = process.env.USE_MOCK === '1';
  
  if (USE_MOCK) {
    // Mock mode - always return true
    return true;
  }
  
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export interface WebhookHandlerResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function handleWebhookEvent(event: WebhookEvent): Promise<WebhookHandlerResult> {
  if (!paymentsEnabled) {
    // Payments disabled - simulate successful processing
    return {
      success: true,
      transactionId: `mock_transaction_${Date.now()}`
    };
  }

  const USE_MOCK = process.env.USE_MOCK === '1';
  
  console.log('Processing webhook event:', event.event);
  
  if (USE_MOCK) {
    // Mock mode - simulate successful processing
    return {
      success: true,
      transactionId: `mock_transaction_${Date.now()}`
    };
  }
  
  try {
    // Handle payment.captured event
    if (event.event === 'payment.captured' && event.payload.payment) {
      const payment = event.payload.payment.entity;
      
      // Find transaction by providerOrderId or providerPaymentId
      // This would typically query your database
      // For now, we'll return success
      
      return {
        success: true,
        transactionId: payment.order_id // Using order_id as transaction reference
      };
    }
    
    // Handle payment.failed event
    if (event.event === 'payment.failed' && event.payload.payment) {
      const payment = event.payload.payment.entity;
      
      // Handle failed payment
      console.log('Payment failed:', payment.id);
      
      return {
        success: true,
        transactionId: payment.order_id
      };
    }
    
    // Handle order.paid event
    if (event.event === 'order.paid' && event.payload.order) {
      const order = event.payload.order.entity;
      
      return {
        success: true,
        transactionId: order.id
      };
    }
    
    return {
      success: false,
      error: 'Unsupported webhook event'
    };
    
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
