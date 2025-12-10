'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { useApiError } from '../../../src/hooks/useApiError';
import { useRouter } from 'next/navigation';
import ErrorBoundary from '../../../src/components/ErrorBoundary';
import { JobDoc, ProviderJobsResponse, PayoutDoc, ProviderPayoutsResponse } from '../../../src/types/app';

export default function ProviderDashboard() {
  const { user, loading } = useAuth();
  const { handleError, handleSuccess } = useApiError();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobDoc[]>([]);
  const [payouts, setPayouts] = useState<PayoutDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      
      const response = await fetch('/api/provider/jobs', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result: ProviderJobsResponse = await response.json();

      if (result.ok && result.items) {
        setJobs(result.items);
      } else {
        throw new Error(result.error || 'Failed to load jobs');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      handleError(err, 'loading jobs');
    }
  };

  const loadPayouts = async () => {
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      
      const response = await fetch('/api/provider/payouts?limit=10', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result: ProviderPayoutsResponse = await response.json();

      if (result.ok && result.items) {
        setPayouts(result.items);
      } else {
        throw new Error(result.error || 'Failed to load payouts');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([loadJobs(), loadPayouts()]).finally(() => setIsLoading(false));
    }
  }, [user]);

  const handleStatusUpdate = async (jobId: string, to: 'accepted' | 'in_progress' | 'completed') => {
    setIsUpdatingStatus(jobId);
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      
      const response = await fetch('/api/provider/jobs/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ jobId, to }),
      });

      const result = await response.json();

      if (result.ok) {
        // Reload jobs to get updated status
        await loadJobs();
        // Reload payouts in case a new one was created
        await loadPayouts();
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  };

  const getPayoutStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'bg-gray-100 text-gray-800',
      queued: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date | string | any) => {
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  const getActionButton = (job: JobDoc) => {
    const { status } = job;
    
    switch (status) {
      case 'pending':
        return (
          <button
            onClick={() => handleStatusUpdate(job.customerId, 'accepted')}
            disabled={isUpdatingStatus === job.customerId}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isUpdatingStatus === job.customerId ? 'Accepting...' : 'Accept'}
          </button>
        );
      case 'accepted':
        return (
          <button
            onClick={() => handleStatusUpdate(job.customerId, 'in_progress')}
            disabled={isUpdatingStatus === job.customerId}
            className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
          >
            {isUpdatingStatus === job.customerId ? 'Starting...' : 'Start'}
          </button>
        );
      case 'in_progress':
        return (
          <button
            onClick={() => handleStatusUpdate(job.customerId, 'completed')}
            disabled={isUpdatingStatus === job.customerId}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
          >
            {isUpdatingStatus === job.customerId ? 'Completing...' : 'Complete'}
          </button>
        );
      default:
        return <span className="text-gray-500 text-sm">No action</span>;
    }
  };

  const calculateEarningsThisMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return payouts
      .filter(payout => {
        const payoutDate = new Date(payout.createdAt instanceof Date ? payout.createdAt : (payout.createdAt as any)?.toDate?.() || new Date());
        return payoutDate >= startOfMonth && payout.status === 'completed';
      })
      .reduce((total, payout) => total + payout.amount, 0);
  };

  if (loading) return <p className="p-6">Loading…</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <ErrorBoundary>
      <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Provider Dashboard</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Earnings Summary */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">💰 Earnings This Month</h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600">₹{calculateEarningsThisMonth()}</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">📋 Active Jobs</h3>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {jobs.filter(job => ['pending', 'accepted', 'in_progress'].includes(job.status)).length}
          </p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border sm:col-span-2 lg:col-span-1">
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">✅ Completed Jobs</h3>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">
            {jobs.filter(job => job.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* My Jobs Table */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">My Jobs</h2>
        
        {isLoading ? (
          <p className="text-gray-500">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No jobs assigned yet.</p>
            <p className="text-sm text-gray-400">Jobs will appear here when customers book services in your area.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">When</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.customerId}>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
                        {formatDate(job.scheduledFor)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
                        {job.serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        <br />
                        <span className="text-gray-500">₹{job.price}</span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={job.address}>
                          {job.address}
                        </div>
                        {job.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={job.notes}>
                            Note: {job.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                          {job.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        {getActionButton(job)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Payouts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Payouts</h2>
        
        {payouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No payouts yet.</p>
            <p className="text-sm text-gray-400">Payouts will appear here when you complete jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.slice(0, 5).map((payout) => (
              <div key={payout.providerId} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">₹{payout.amount}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(payout.createdAt)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPayoutStatusBadge(payout.status)}`}>
                    {payout.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
            
            {payouts.length > 5 && (
              <button
                onClick={() => router.push('/payouts/provider')}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200"
              >
                View All Payouts
              </button>
            )}
          </div>
        )}
      </div>
      </main>
    </ErrorBoundary>
  );
}