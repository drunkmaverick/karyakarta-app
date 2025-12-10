/**
 * Analytics tracking utilities
 * Tracks booking and payment events for analytics
 */

export interface BookingEvent {
  event: 'booking_created' | 'booking_confirmed' | 'payment_initiated' | 'payment_completed';
  jobId: string;
  serviceType: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  timestamp: Date;
}

export interface AnalyticsData {
  event: string;
  properties: Record<string, any>;
}

/**
 * Track a booking or payment event
 * This would typically send data to your analytics service (Google Analytics, Mixpanel, etc.)
 */
export function trackEvent(event: BookingEvent): void {
  // In a real implementation, this would send data to your analytics service
  console.log('📊 Analytics Event:', {
    event: event.event,
    jobId: event.jobId,
    serviceType: event.serviceType,
    amount: event.amount,
    currency: event.currency,
    paymentMethod: event.paymentMethod,
    timestamp: event.timestamp.toISOString()
  });

  // Example: Send to Google Analytics (if implemented)
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', event.event, {
  //     job_id: event.jobId,
  //     service_type: event.serviceType,
  //     value: event.amount,
  //     currency: event.currency || 'INR'
  //   });
  // }

  // Example: Send to custom analytics endpoint
  // fetch('/api/analytics/track', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(event)
  // }).catch(console.error);
}

/**
 * Track booking creation
 */
export function trackBookingCreated(jobId: string, serviceType: string, amount?: number): void {
  trackEvent({
    event: 'booking_created',
    jobId,
    serviceType,
    amount,
    currency: 'INR',
    timestamp: new Date()
  });
}

/**
 * Track booking confirmation (when payments are disabled)
 */
export function trackBookingConfirmed(jobId: string, serviceType: string, amount?: number): void {
  trackEvent({
    event: 'booking_confirmed',
    jobId,
    serviceType,
    amount,
    currency: 'INR',
    timestamp: new Date()
  });
}

/**
 * Track payment initiation
 */
export function trackPaymentInitiated(jobId: string, serviceType: string, amount: number, paymentMethod: string = 'razorpay'): void {
  trackEvent({
    event: 'payment_initiated',
    jobId,
    serviceType,
    amount,
    currency: 'INR',
    paymentMethod,
    timestamp: new Date()
  });
}

/**
 * Track payment completion
 */
export function trackPaymentCompleted(jobId: string, serviceType: string, amount: number, paymentMethod: string = 'razorpay'): void {
  trackEvent({
    event: 'payment_completed',
    jobId,
    serviceType,
    amount,
    currency: 'INR',
    paymentMethod,
    timestamp: new Date()
  });
}
