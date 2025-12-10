/**
 * Example component demonstrating network utility usage
 */

'use client';

import React, { useState } from 'react';
import { useNetwork, useNetworkFetch, useRetryableOperation } from '../src/hooks/useNetwork';
import NetworkStatus, { NetworkIndicator } from './NetworkStatus';
import Button from './ui/Button';

export default function NetworkExample() {
  const { isOnline, isConnecting, retryCount } = useNetwork();
  const { get, post, put, delete: del } = useNetworkFetch();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example of retryable operation
  const fetchDataWithRetry = useRetryableOperation(
    async () => {
      const response = await get('/api/campaigns/list?limit=5');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    [],
    { maxRetries: 3, baseDelay: 1000 }
  );

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchDataWithRetry();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await post('/api/campaigns/create', {
        title: 'Test Campaign',
        description: 'Created via network utility',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        maxParticipants: 10,
        budget: 1000
      });
      
      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`);
      }
      
      const responseData = await result.json();
      setData(responseData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateData = async () => {
    if (!data?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await put(`/api/campaigns/update?id=${data.id}`, {
        ...data,
        title: 'Updated Campaign',
        updatedAt: new Date().toISOString()
      });
      
      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`);
      }
      
      const responseData = await result.json();
      setData(responseData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (!data?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await del(`/api/campaigns/delete?id=${data.id}`);
      
      if (!result.ok) {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`);
      }
      
      setData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Network Utility Example</h2>
        
        {/* Network Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Network Status</h3>
          <NetworkStatus showDetails={true} />
          <div className="mt-2">
            <NetworkIndicator />
          </div>
        </div>

        {/* Network State Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current State</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Online:</span>
              <span className={`ml-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Connecting:</span>
              <span className={`ml-2 ${isConnecting ? 'text-yellow-600' : 'text-gray-600'}`}>
                {isConnecting ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Retry Count:</span>
              <span className="ml-2 text-gray-600">{retryCount}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Loading:</span>
              <span className={`ml-2 ${loading ? 'text-blue-600' : 'text-gray-600'}`}>
                {loading ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* API Test Buttons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">API Tests</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleFetchData}
              disabled={!isOnline || loading}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'GET Data (with retry)'}
            </Button>
            
            <Button
              onClick={handlePostData}
              disabled={!isOnline || loading}
              className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'POST Data'}
            </Button>
            
            <Button
              onClick={handleUpdateData}
              disabled={!isOnline || loading || !data?.id}
              className="bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'PUT Data'}
            </Button>
            
            <Button
              onClick={handleDeleteData}
              disabled={!isOnline || loading || !data?.id}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'DELETE Data'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Data Display */}
        {data && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Response Data</h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Usage Instructions</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>GET requests</strong> automatically retry with exponential backoff</li>
            <li>• <strong>POST/PUT/DELETE requests</strong> show toast notifications on failure</li>
            <li>• <strong>Offline detection</strong> prevents requests when network is unavailable</li>
            <li>• <strong>Retry logic</strong> handles temporary network issues gracefully</li>
            <li>• <strong>Network state</strong> is shared across all components via Zustand store</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
