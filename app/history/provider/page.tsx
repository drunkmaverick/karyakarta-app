'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { JobDoc, ProviderJobsResponse, PayoutDoc, ProviderPayoutsResponse } from '../../../src/types/app';

export default function ProviderHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobDoc[]>([]);
  const [payouts, setPayouts] = useState<PayoutDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

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
      setError(err.message || 'An error occurred');
    }
  };

  const loadPayouts = async () => {
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      
      const response = await fetch('/api/provider/payouts?limit=50', {
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

  const getPayoutForJob = (jobId: string) => {
    return payouts.find(payout => payout.jobId === jobId);
  };

  const completedJobs = jobs.filter(job => job.status === 'completed');
  const totalEarnings = completedJobs.reduce((total, job) => total + job.price, 0);

  if (loading) return <p className="p-6">Loading…</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Job History</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">📊 Total Jobs</h3>
          <p className="text-2xl font-bold text-blue-600">{jobs.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">✅ Completed</h3>
          <p className="text-2xl font-bold text-green-600">{completedJobs.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">💰 Total Earnings</h3>
          <p className="text-2xl font-bold text-purple-600">₹{totalEarnings}</p>
        </div>
      </div>

      {/* Jobs List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Jobs</h2>
        
        {isLoading && jobs.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow border animate-pulse">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No job history found.</p>
            <p className="text-sm text-gray-400">Jobs will appear here when you're assigned to them.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const payout = getPayoutForJob(job.customerId);
              
              return (
                <div key={job.customerId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {job.serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Scheduled: {formatDate(job.scheduledFor)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                      {job.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-700">
                      <strong>Address:</strong> {job.address}
                    </p>
                    {job.notes && (
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Notes:</strong> {job.notes}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Price:</strong> ₹{job.price}
                    </p>
                  </div>

                  {job.rating && (
                    <div className="mb-3 p-2 bg-gray-50 rounded">
                      <p className="text-sm">
                        <strong>Customer Rating:</strong> {'★'.repeat(job.rating.score)}{'☆'.repeat(5 - job.rating.score)} ({job.rating.score}/5)
                      </p>
                      {job.rating.comment && (
                        <p className="text-sm text-gray-600 mt-1">"{job.rating.comment}"</p>
                      )}
                    </div>
                  )}

                  {payout && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Payout:</span>
                        <span className="text-sm font-medium">₹{payout.amount}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPayoutStatusBadge(payout.status)}`}>
                          {payout.status.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => router.push('/payouts/provider')}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}