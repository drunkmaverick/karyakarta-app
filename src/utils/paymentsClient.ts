// Frontend Razorpay integration utilities
import { paymentsEnabled } from '../lib/flags';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number;
  name: string;
  description: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

export async function initRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if payments are disabled
    if (!paymentsEnabled) {
      console.log('Payments disabled: Simulating Razorpay script load');
      // Mock Razorpay object
      (window as any).Razorpay = {
        open: (options: any) => {
          console.log('Mock: Opening Razorpay checkout with options:', options);
          // Simulate successful payment after 2 seconds
          setTimeout(() => {
            const mockResponse = {
              razorpay_payment_id: `mock_payment_${Date.now()}`,
              razorpay_order_id: options.order_id,
              razorpay_signature: `mock_signature_${Date.now()}`
            };
            options.handler(mockResponse);
          }, 2000);
        }
      };
      resolve(true);
      return;
    }

    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if we're in mock mode
    const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === '1';
    if (USE_MOCK) {
      console.log('Mock mode: Simulating Razorpay script load');
      // Mock Razorpay object
      (window as any).Razorpay = {
        open: (options: any) => {
          console.log('Mock: Opening Razorpay checkout with options:', options);
          // Simulate successful payment after 2 seconds
          setTimeout(() => {
            const mockResponse = {
              razorpay_payment_id: `mock_payment_${Date.now()}`,
              razorpay_order_id: options.order_id,
              razorpay_signature: `mock_signature_${Date.now()}`
            };
            options.handler(mockResponse);
          }, 2000);
        }
      };
      resolve(true);
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('Razorpay script loaded');
      resolve(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  if (!paymentsEnabled) {
    throw new Error('Payments are disabled. Cannot open Razorpay checkout.');
  }

  const scriptLoaded = await initRazorpayScript();
  
  if (!scriptLoaded) {
    throw new Error('Failed to load Razorpay script');
  }

  const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === '1';
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_TEST;

  if (!keyId && !USE_MOCK) {
    throw new Error('Razorpay key not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_TEST when payments are enabled.');
  }

  const checkoutOptions = {
    key: keyId || 'mock_key',
    amount: options.amount * 100, // Convert to paise
    currency: 'INR',
    name: options.name,
    description: options.description,
    order_id: options.orderId,
    handler: options.handler,
    prefill: options.prefill || {},
    theme: {
      color: '#2563eb'
    },
    modal: {
      ondismiss: () => {
        console.log('Checkout modal dismissed');
      }
    }
  };

  const razorpay = new window.Razorpay(checkoutOptions);
  razorpay.open();
}

export async function verifyPayment(
  paymentId: string,
  orderId: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/transactions/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId,
        orderId,
        signature
      })
    });

    const result = await response.json();
    return { success: result.ok, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



