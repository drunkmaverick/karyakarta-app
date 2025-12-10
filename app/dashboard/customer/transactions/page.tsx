'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { TransactionDoc } from '../../../../src/types/app';
import { CheckCircle, XCircle, Clock, RefreshCw, Eye } from 'lucide-react';

export default function CustomerTransactionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionDoc[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    if (user) {
      loadTransactions();
    }
  }, [user, loading]);

  const loadTransactions = async () => {
    try {
      if (!user) return;

      const idToken = await (user as any).getIdToken();
      const response = await fetch('/api/transactions/list', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      if (result.ok && result.items) {
        setTransactions(result.items);
      } else {
        setError(result.error || 'Failed to load transactions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      succeeded: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date | any) => {
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  if (loading || loadingTransactions) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Transactions</h1>
        <button
          onClick={loadTransactions}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">No transactions found</p>
          <p className="text-gray-400 mt-2">Your payment history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Transaction #{transaction.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Job ID: {transaction.jobId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ₹{transaction.amount}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.currency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </span>
                    </div>
                    
                    {transaction.providerPaymentId && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="h-4 w-4 mr-1" />
                        Payment ID: {transaction.providerPaymentId.slice(-8)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}









