'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { JobDoc, JobsByCustomerResponse } from '../../../src/types/app';
import EmptyState from '../../../components/ui/EmptyState';
import { ListSkeleton } from '../../../components/ui/LoadingSkeleton';
import ErrorState from '../../../components/ui/ErrorState';
import { useUIState } from '../../../src/hooks/useUIState';
import { Calendar, Clock, MapPin, User, Star } from 'lucide-react';

export default function CustomerHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobDoc[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [ratingModal, setRatingModal] = useState<{ jobId: string; isOpen: boolean }>({ jobId: '', isOpen: false });
  const [ratingData, setRatingData] = useState({ score: 5, comment: '' });
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const uiState = useUIState();

  const loadJobs = async (cursor?: string) => {
    try {
      if (!user) return;

      if (!cursor) {
        uiState.setLoading(true);
        uiState.setError(null);
      }

      const idToken = await (user as any).getIdToken();
      const url = cursor 
        ? `/api/jobs/by-customer?limit=20&cursor=${cursor}`
        : '/api/jobs/by-customer?limit=20';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result: JobsByCustomerResponse = await response.json();

      if (result.ok && result.items) {
        if (cursor) {
          setJobs(prev => [...prev, ...result.items!]);
        } else {
          setJobs(result.items);
        }
        setNextCursor(result.nextCursor);
      } else {
        const errorMsg = result.error || 'Failed to load jobs';
        uiState.setError(errorMsg);
        uiState.showErrorToast(errorMsg, 'Failed to load jobs');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      uiState.setError(errorMsg);
      uiState.showErrorToast(errorMsg, 'Network Error');
    } finally {
      uiState.setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  const handleRateJob = async (jobId: string) => {
    setIsSubmittingRating(true);
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      
      const response = await fetch('/api/jobs/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          jobId,
          score: ratingData.score,
          comment: ratingData.comment
        }),
      });

      const result = await response.json();

      if (result.ok) {
        // Update local state
        setJobs(prev => prev.map(job => 
          job.customerId === (user as any)?.uid && job.status === 'completed' && !job.rating
            ? { ...job, rating: { score: ratingData.score, comment: ratingData.comment, byCustomerId: (user as any)?.uid } }
            : job
        ));
        setRatingModal({ jobId: '', isOpen: false });
        setRatingData({ score: 5, comment: '' });
      } else {
        throw new Error(result.error || 'Failed to submit rating');
      }
    } catch (err: any) {
      uiState.setError(err.message || 'An error occurred');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleRepeatJob = async (jobId: string) => {
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      
      const response = await fetch('/api/jobs/repeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ jobId }),
      });

      const result = await response.json();

      if (result.ok) {
        // Reload jobs to show the new one
        loadJobs();
      } else {
        throw new Error(result.error || 'Failed to repeat job');
      }
    } catch (err: any) {
      uiState.setError(err.message || 'An error occurred');
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

  const formatDate = (date: Date | string | any) => {
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  if (loading) return <p className="p-6">Loading…</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  if (uiState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job History</h1>
            <p className="text-gray-600">View your completed and ongoing jobs</p>
          </div>
          <ListSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (uiState.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job History</h1>
            <p className="text-gray-600">View your completed and ongoing jobs</p>
          </div>
          <ErrorState
            message={uiState.error}
            onRetry={() => loadJobs()}
            retryCount={uiState.retryCount}
            isOffline={uiState.isOffline}
          />
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Service History</h1>
      
      {uiState.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {uiState.error}
        </div>
      )}

      {uiState.loading && jobs.length === 0 ? (
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
        <EmptyState
          icon={Calendar}
          title="No bookings yet"
          description="You haven't booked any services yet. Get started by creating a community cleanup!"
          action={{
            label: "Create Community Cleanup",
            onClick: () => router.push('/cleanup/create')
          }}
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
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
                    <strong>Your Rating:</strong> {'★'.repeat(job.rating.score)}{'☆'.repeat(5 - job.rating.score)} ({job.rating.score}/5)
                  </p>
                  {job.rating.comment && (
                    <p className="text-sm text-gray-600 mt-1">"{job.rating.comment}"</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {job.status === 'completed' && !job.rating && (
                  <button
                    onClick={() => setRatingModal({ jobId: job.customerId, isOpen: true })}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    Rate Service
                  </button>
                )}
                
                <button
                  onClick={() => handleRepeatJob(job.customerId)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Repeat
                </button>
              </div>
            </div>
          ))}

          {nextCursor && (
            <button
              onClick={() => {
                setIsLoadingMore(true);
                loadJobs(nextCursor);
              }}
              disabled={isLoadingMore}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading more...' : 'Load More'}
            </button>
          )}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Rate Your Service</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating (1-5 stars)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingData(prev => ({ ...prev, score: star }))}
                    className={`text-2xl ${
                      star <= ratingData.score ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional)
              </label>
              <textarea
                value={ratingData.comment}
                onChange={(e) => setRatingData(prev => ({ ...prev, comment: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleRateJob(ratingModal.jobId)}
                disabled={isSubmittingRating}
                className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
              <button
                onClick={() => setRatingModal({ jobId: '', isOpen: false })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}