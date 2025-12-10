'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, User, MessageSquare, CheckCircle, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { paymentsEnabled } from '../../../src/lib/flags';

const SERVICES = [
  { id: 'deep_cleaning', name: 'Deep Cleaning', description: 'Comprehensive cleaning service' },
  { id: 'ac_service', name: 'AC Service', description: 'Air conditioning maintenance and cleaning' },
  { id: 'plumbing', name: 'Plumbing', description: 'Basic plumbing repairs and maintenance' },
  { id: 'electrical', name: 'Electrical', description: 'Electrical repairs and installations' },
  { id: 'maid_service', name: 'Maid Service', description: 'Regular housekeeping service' },
];

export default function NewBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [retryCount, setRetryCount] = useState(0);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    service: '',
    scheduledAt: '',
    address: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('info');

    try {
      // Get user token (assuming user is authenticated)
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (!user) {
        router.push('/login');
        return;
      }

      const idToken = await user.getIdToken();
      
      // Calculate price based on service type
      const servicePrices: Record<string, number> = {
        deep_cleaning: 1499,
        ac_service: 699,
        plumbing: 399,
        electrical: 499,
        maid_service: 299
      };
      
      const price = servicePrices[formData.service] || 0;
      
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          serviceType: formData.service,
          scheduledForISO: new Date(formData.scheduledAt).toISOString(),
          address: formData.address,
          notes: formData.notes,
          price: price
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setSuccess(true);
        setMessageType('success');
        
        if (paymentsEnabled) {
          setMessage('Booking created successfully! Redirecting to payment...');
          setTimeout(() => {
            router.push(`/bookings/checkout?jobId=${result.id}`);
          }, 2000);
        } else {
          setMessage('Booking confirmed! You\'ll receive details by SMS/Email.');
          setTimeout(() => {
            router.push('/history/customer');
          }, 3000);
        }
      } else {
        setMessageType('error');
        setMessage(`Error: ${result.error}`);
        setRetryCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setMessageType('error');
      setMessage('Error creating booking. Please try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setMessage('');
    setMessageType('info');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().slice(0, 16);

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {paymentsEnabled ? 'Booking Created!' : 'Booking Confirmed!'}
              </h1>
              <p className="text-gray-600 text-lg">
                {paymentsEnabled 
                  ? 'Your booking has been created. You\'ll be redirected to payment shortly.'
                  : 'You\'ll receive booking details by SMS/Email.'
                }
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Booking Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Service:</span> {SERVICES.find(s => s.id === formData.service)?.name}</p>
                  <p><span className="font-medium">Date & Time:</span> {new Date(formData.scheduledAt).toLocaleString()}</p>
                  <p><span className="font-medium">Address:</span> {formData.address}</p>
                  {formData.notes && <p><span className="font-medium">Notes:</span> {formData.notes}</p>}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/history/customer')}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  My Bookings
                </button>
                <button
                  onClick={() => router.push('/dashboard/customer')}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Service</h1>
            <p className="text-gray-600">Schedule your cleaning or maintenance service</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-start ${
              messageType === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : messageType === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {messageType === 'error' ? (
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              ) : messageType === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              ) : null}
              <div className="flex-1">
                <p className="font-medium">{message}</p>
                {messageType === 'error' && retryCount > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={handleRetry}
                      className="text-sm text-red-600 hover:text-red-700 underline flex items-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Service Type
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a service</option>
                {SERVICES.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date & Time
              </label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleInputChange}
                min={minDate}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Service Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your full address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Any special instructions or requirements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}