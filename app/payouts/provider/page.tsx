'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { PayoutDoc, ProviderPayoutsResponse } from '../../../src/types/app';

export default function ProviderPayoutsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<PayoutDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadPayouts = useCallback(async (cursor?: string) => {
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      const url = cursor 
        ? `/api/provider/payouts?limit=20&cursor=${cursor}`
        : '/api/provider/payouts?limit=20';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result: ProviderPayoutsResponse = await response.json();

      if (result.ok && result.items) {
        if (cursor) {
          setPayouts(prev => [...prev, ...result.items!]);
        } else {
          setPayouts(result.items);
        }
        setNextCursor(result.nextCursor);
      } else {
        throw new Error(result.error || 'Failed to load payouts');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPayouts();
    }
  }, [user, loadPayouts]);

  const getStatusBadge = (status: string) => {
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

  const calculateTotals = () => {
    const completed = payouts.filter(p => p.status === 'completed');
    const pending = payouts.filter(p => ['draft', 'queued'].includes(p.status));
    
    return {
      totalCompleted: completed.reduce((sum, p) => sum + p.amount, 0),
      totalPending: pending.reduce((sum, p) => sum + p.amount, 0),
      completedCount: completed.length,
      pendingCount: pending.length
    };
  };

  const totals = calculateTotals();

  if (loading) return <p className="p-6">Loading…</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payouts</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">💰 Total Completed</h3>
          <p className="text-2xl font-bold text-green-600">₹{totals.totalCompleted}</p>
          <p className="text-sm text-gray-500">{totals.completedCount} payouts</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">⏳ Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">₹{totals.totalPending}</p>
          <p className="text-sm text-gray-500">{totals.pendingCount} payouts</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">📊 Total Payouts</h3>
          <p className="text-2xl font-bold text-blue-600">{payouts.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">💵 Total Earnings</h3>
          <p className="text-2xl font-bold text-purple-600">₹{totals.totalCompleted + totals.totalPending}</p>
        </div>
      </div>

      {/* Payouts List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Payout History</h2>
        
        {isLoading && payouts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow border animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No payouts yet.</p>
            <p className="text-sm text-gray-400">Payouts will appear here when you complete jobs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <div key={payout.providerId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">₹{payout.amount}</h3>
                    <p className="text-sm text-gray-600">
                      Created: {formatDate(payout.createdAt)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Job ID: {payout.jobId}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payout.status)}`}>
                    {payout.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Status: {payout.status}</p>
                    {payout.status === 'completed' && (
                      <p className="text-green-600 font-medium">✓ Payment processed</p>
                    )}
                    {payout.status === 'queued' && (
                      <p className="text-yellow-600 font-medium">⏳ Processing payment</p>
                    )}
                    {payout.status === 'draft' && (
                      <p className="text-gray-600 font-medium">📝 Pending approval</p>
                    )}
                    {payout.status === 'failed' && (
                      <p className="text-red-600 font-medium">❌ Payment failed</p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Updated: {formatDate(payout.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {nextCursor && (
              <button
                onClick={() => {
                  setIsLoadingMore(true);
                  loadPayouts(nextCursor);
                }}
                disabled={isLoadingMore}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading more...' : 'Load More'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}