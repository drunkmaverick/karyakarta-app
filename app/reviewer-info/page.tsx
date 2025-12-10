'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, User, Key, CheckCircle, AlertCircle, Copy, ExternalLink, Smartphone, CreditCard, Calendar, MapPin } from 'lucide-react';

function ReviewerInfoPageContent() {
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = searchParams?.get('token');
    const expectedToken = process.env.NEXT_PUBLIC_REVIEWER_TOKEN;
    
    if (token === expectedToken) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
    setIsLoading(false);
  }, [searchParams]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Invalid or missing reviewer token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Reviewer Information</h1>
          </div>
          <p className="text-lg text-gray-600">Test credentials and QA steps for Karyakarta app review</p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h3>
              <p className="text-yellow-700">
                <strong>Payments are currently disabled.</strong> All bookings complete without payment. 
                Users see a "payments coming soon" message during checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Key className="h-6 w-6 mr-3 text-blue-600" />
            Test Credentials
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Account */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Customer Account
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={process.env.NEXT_PUBLIC_TEST_CUSTOMER_EMAIL || 'customer@test.com'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_TEST_CUSTOMER_EMAIL || 'customer@test.com')}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={process.env.NEXT_PUBLIC_TEST_CUSTOMER_PASSWORD || 'testpass123'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_TEST_CUSTOMER_PASSWORD || 'testpass123')}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Account */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Admin Account
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={process.env.NEXT_PUBLIC_TEST_ADMIN_EMAIL || 'admin@test.com'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_TEST_ADMIN_EMAIL || 'admin@test.com')}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={process.env.NEXT_PUBLIC_TEST_ADMIN_PASSWORD || 'adminpass123'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_TEST_ADMIN_PASSWORD || 'adminpass123')}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QA Testing Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
            QA Testing Steps
          </h2>
          
          <div className="space-y-6">
            {/* Step 1: Login */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
                Login Testing
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>• Navigate to <code className="bg-gray-100 px-2 py-1 rounded text-sm">/login</code></p>
                <p>• Test both customer and admin login credentials above</p>
                <p>• Verify successful authentication and redirect</p>
                <p>• Test logout functionality</p>
              </div>
            </div>

            {/* Step 2: Create Booking */}
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
                Create Booking (Customer)
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>• Login as customer</p>
                <p>• Navigate to <code className="bg-gray-100 px-2 py-1 rounded text-sm">/bookings/new</code></p>
                <p>• Fill out booking form with test data</p>
                <p>• <strong>Note:</strong> No payment required - booking completes directly</p>
                <p>• Verify booking appears in customer history</p>
              </div>
            </div>

            {/* Step 3: Admin Review */}
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">3</span>
                Admin Dashboard Review
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>• Login as admin</p>
                <p>• Navigate to <code className="bg-gray-100 px-2 py-1 rounded text-sm">/admin</code></p>
                <p>• Review jobs, customers, and analytics sections</p>
                <p>• Test admin functionality (if available)</p>
              </div>
            </div>

            {/* Step 4: Payment Flow */}
            <div className="border-l-4 border-yellow-500 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">4</span>
                Payment Flow (Disabled)
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>• Navigate to checkout page</p>
                <p>• Verify "payments coming soon" banner is displayed</p>
                <p>• Confirm "Confirm booking" button (not "Pay")</p>
                <p>• Verify booking completes without payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* App Features Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Smartphone className="h-6 w-6 mr-3 text-indigo-600" />
            App Features Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Booking System</h3>
              <p className="text-sm text-gray-600">Create and manage service bookings</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <MapPin className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Location Services</h3>
              <p className="text-sm text-gray-600">Address-based service matching</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <CreditCard className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Payment Ready</h3>
              <p className="text-sm text-gray-600">Infrastructure ready, currently disabled</p>
            </div>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Environment:</span>
              <span className="ml-2 text-gray-600">{process.env.NODE_ENV || 'development'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Payments:</span>
              <span className="ml-2 text-gray-600">
                {process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true' ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Build Date:</span>
              <span className="ml-2 text-gray-600">{new Date().toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Reviewer Access:</span>
              <span className="ml-2 text-green-600">✓ Authorized</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>This page is only accessible with a valid reviewer token.</p>
          <p className="mt-1">For support, contact: <a href="mailto:support@karyakarta.com" className="text-blue-600 hover:underline">support@karyakarta.com</a></p>
        </div>
      </div>
    </div>
  );
}

export default function ReviewerInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ReviewerInfoPageContent />
    </Suspense>
  );
}
