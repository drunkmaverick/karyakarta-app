'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../src/hooks/useAuth';
import { openRazorpayCheckout } from '../../../src/utils/paymentsClient';
import { JobDoc } from '../../../src/types/app';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { paymentsEnabled } from '../../../src/lib/flags';
import { trackPaymentInitiated, trackPaymentCompleted } from '../../../src/lib/analytics';

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [job, setJob] = useState<JobDoc | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const jobId = searchParams?.get('jobId');

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    if (jobId && user) {
      loadJob();
    }
  }, [user, loading, jobId]);

  const loadJob = async () => {
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      const response = await fetch(`/api/jobs/by-customer?limit=100`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      if (result.ok && result.items) {
        // Find job by jobId parameter - in mock mode, we'll use the first job
        const foundJob = result.items.find((j: any) => j.id === jobId) || result.items[0];
        if (foundJob) {
          setJob(foundJob);
        } else {
          setError('Job not found');
        }
      } else {
        setError(result.error || 'Failed to load job');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoadingJob(false);
    }
  };

  const handlePayment = async () => {
    if (!job || !user) return;

    setProcessing(true);
    setError('');

    try {
      if (!paymentsEnabled) {
        // Payments disabled - simulate successful booking
        console.log('Payments disabled: Simulating successful booking');
        
        // Track payment completion for analytics (even though no real payment)
        if (job) {
          trackPaymentCompleted((job as any).id, job.serviceType, job.price, 'none');
        }
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/history/customer');
        }, 2000);
        return;
      }

      const idToken = await (user as any).getIdToken();
      
      // Create transaction
      const transactionResponse = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          jobId: jobId || 'mock-job-id',
          amount: job.price,
          currency: 'INR'
        })
      });

      const transactionResult = await transactionResponse.json();
      if (!transactionResult.ok) {
        throw new Error(transactionResult.error || 'Failed to create transaction');
      }

      // Track payment initiation
      trackPaymentInitiated((job as any).id, job.serviceType, job.price, 'razorpay');

      // Open Razorpay checkout
      await openRazorpayCheckout({
        orderId: transactionResult.orderId!,
        amount: transactionResult.amount!,
        name: 'KaryaKarta',
        description: `Payment for ${job.serviceType.replace(/_/g, ' ')}`,
        handler: async (response: any) => {
          console.log('Payment successful:', response);
          
          // Track payment completion
          trackPaymentCompleted((job as any).id, job.serviceType, job.price, 'razorpay');
          
          setSuccess(true);
          
          // In real mode, you might want to verify the payment signature here
          // For now, we'll just show success
          
          setTimeout(() => {
            router.push('/history/customer');
          }, 3000);
        },
        prefill: {
          name: (user as any)?.displayName || '',
          email: (user as any)?.email || '',
          contact: (user as any)?.phoneNumber || ''
        }
      });

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || loadingJob) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/bookings')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your payment has been processed successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to your bookings...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No job found for checkout.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        {!paymentsEnabled && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Online payments coming soon</h3>
              <p className="text-sm text-blue-700 mt-1">Bookings complete without payment. You'll be notified when payment is required.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Service:</span>
                <span className="ml-2 font-medium">
                  {job.serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Scheduled:</span>
                <span className="ml-2 font-medium">
                  {new Date(job.scheduledFor instanceof Date ? job.scheduledFor : (job.scheduledFor as any)?.toDate?.() || new Date()).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Address:</span>
                <span className="ml-2 font-medium">{job.address}</span>
              </div>
              {job.notes && (
                <div>
                  <span className="text-gray-600">Notes:</span>
                  <span className="ml-2 font-medium">{job.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-medium">₹{job.price}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-semibold">₹{job.price}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : paymentsEnabled ? (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ₹{job.price}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm booking
                </>
              )}
            </button>

            {paymentsEnabled && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Secure payment powered by Razorpay
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
