'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { useApiError } from '../../../src/hooks/useApiError';
import { db } from '../../../src/services/firebase';
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setupPushNotifications, onForegroundMessage, unregisterTokenOnServer, deleteLocalToken } from '../../../src/utils/pushClient';
import { getCurrentLocation } from '../../../src/lib/geo';
import ErrorBoundary from '../../../src/components/ErrorBoundary';

type Campaign = {
  id: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'done';
  organizerId: string;
  organizerName?: string;
  location?: { lat: number; lng: number };
  locationName?: string;               // ← human-readable label (optional)
  startAt?: Timestamp;
  joinedCount?: number;
  participants?: string[];             // array of userIds
};

export default function CustomerDashboard() {
  const { user, loading } = useAuth();
  const { handleError, handleSuccess } = useApiError();
  const router = useRouter();

  // Generate stable guest ID for non-authenticated users
  const getStableUserId = () => {
    if (user && typeof user === 'object' && 'uid' in user) {
      return (user as any).uid;
    }
    
    // Generate a stable guest ID based on browser fingerprint
    let guestId = localStorage.getItem('karyakarta_guest_id');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('karyakarta_guest_id', guestId);
    }
    return guestId;
  };

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [fetching, setFetching] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [environment, setEnvironment] = useState<'mock' | 'real'>('mock');
  const [pushMode, setPushMode] = useState<'mock' | 'real'>('mock');

  useEffect(() => {
    // Check environment
    const checkEnvironment = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.ok) {
          setEnvironment(data.environment || 'mock');
        }
      } catch (error) {
        console.error('Error checking environment:', error);
        setEnvironment('mock');
      }
    };
    
    checkEnvironment();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Check notification permission
    if (typeof window !== 'undefined') {
      const permission = Notification.permission as 'granted' | 'denied' | 'default';
      setNotificationPermission(permission);
      setNotificationStatus(permission === 'default' ? 'unknown' : permission);
      
      // Auto-setup push notifications if permission is already granted
      if (permission === 'granted') {
        handleAutoSetup();
      }
    }

    // Listen for foreground messages
    const unsubscribeForeground = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
      setMessage(`📱 New notification: ${payload.notification?.title || 'Campaign update'}`);
    });

    const load = async () => {
      setFetching(true);
      try {
        // Fetch campaigns from the API instead of directly from Firestore
        const response = await fetch('/api/campaigns/list?limit=10');
        const data = await response.json();
        
        if (data.success) {
          const items: Campaign[] = data.campaigns.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            status: c.status === 'live' ? 'live' : c.status === 'scheduled' ? 'scheduled' : 'done',
            organizerId: 'admin', // Campaigns are created by admin
            organizerName: 'KaryaKarta Admin',
            location: c.center,
            locationName: c.areaName,
            joinedCount: 0, // This would need to be tracked separately
            participants: [], // This would need to be tracked separately
          }));
          setCampaigns(items);
        } else {
          throw new Error(data.error || 'Failed to load campaigns');
        }
      } catch (e: any) {
        console.error('🔥 load error:', e);
        setMessage(e.message || 'Failed to load campaigns');
      } finally {
        setFetching(false);
      }
    };
    load();

    return () => {
      unsubscribeForeground();
    };
  }, [user]);

  const handleJoin = async (campaignId: string) => {
    if (!(user as any)?.uid) {
      router.push('/login');
      return;
    }

    setJoiningId(campaignId);
    setMessage('');
    try {
      // For now, just show a message since we don't have a join API yet
      // In a real implementation, you would call an API to join the campaign
      setMessage('🎉 Campaign join functionality coming soon!');
      
      // Optimistic local update (mock)
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                participants: c.participants
                  ? [...c.participants, (user as any).uid]
                  : [(user as any).uid],
                joinedCount: (c.joinedCount || 0) + 1,
              }
            : c
        )
      );
    } catch (e: any) {
      console.error('🔥 join error:', e);
      setMessage(e.message || 'Failed to join');
    } finally {
      setJoiningId(null);
    }
  };

  const handleAutoSetup = async () => {
    try {
      const location = await getCurrentLocation();
      const result = await setupPushNotifications({ 
        userId: getStableUserId(),
        role: 'customer',
        lat: location?.lat,
        lng: location?.lng
      });
      if (result.success) {
        setPushToken(result.token || null);
        setPushMode(result.mode || 'real');
        setMessage(`🔔 Notifications enabled automatically! (${result.mode || 'real'} mode)`);
      }
    } catch (error) {
      console.error('Auto-setup failed:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      // Request location permission with rationale before enabling notifications
      const location = await getCurrentLocation({ 
        showRationale: true,
        enableHighAccuracy: true 
      });
      
      const result = await setupPushNotifications({ 
        userId: getStableUserId(),
        role: 'customer',
        lat: location?.lat,
        lng: location?.lng
      });
      
      if (result.success) {
        setNotificationStatus('granted');
        setNotificationPermission('granted');
        setPushToken(result.token || null);
        setPushMode(result.mode || 'real');
        setMessage(`🔔 Notifications enabled successfully! (${result.mode || 'real'} mode)`);
      } else {
        setNotificationStatus('denied');
        setNotificationPermission('denied');
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setMessage('❌ Error enabling notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    setIsLoading(true);
    try {
      // Request location permission with rationale
      const location = await getCurrentLocation({ 
        showRationale: true,
        enableHighAccuracy: true 
      });
      
      if (location) {
        const { updateUserLocation } = await import('../../../src/lib/pushClient');
        const success = await updateUserLocation(location.lat, location.lng);
        
        if (success) {
          setLocationStatus(`📍 Location updated: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
          setMessage(`📍 Location updated successfully!`);
        } else {
          setMessage(`❌ Error updating location`);
        }
      } else {
        setMessage('❌ Location access denied or unavailable. Please enable location access in your browser settings.');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setMessage('❌ Error updating location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!pushToken) {
      setMessage('❌ No push token available. Please enable notifications first.');
      return;
    }

    setIsTestLoading(true);
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: pushToken })
      });

      const data = await response.json();

      if (data.ok) {
        setMessage('🧪 Test notification sent! Check your notifications.');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('❌ Error sending test notification');
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      if (pushToken) {
        // Unregister token from server
        await unregisterTokenOnServer(pushToken);
        // Delete local token
        await deleteLocalToken();
      }
      
      setPushToken(null);
      setNotificationStatus('denied');
      setNotificationPermission('denied');
      setMessage('🔕 Notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setMessage('❌ Error disabling notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout hook to clean up push tokens
  const handleLogout = async () => {
    try {
      if (pushToken) {
        await unregisterTokenOnServer(pushToken);
        await deleteLocalToken();
      }
      // Clear local state
      setPushToken(null);
      setNotificationStatus('unknown');
      setNotificationPermission('default');
    } catch (error) {
      console.error('Error during logout cleanup:', error);
    }
  };

  // Add logout cleanup to useEffect
  useEffect(() => {
    // This would be called when user logs out
    // You might want to expose this function or call it from a logout handler
    return () => {
      // Cleanup on component unmount
      if (pushToken) {
        handleLogout();
      }
    };
  }, [pushToken]);

  if (loading || fetching) return <p className="p-6">Loading…</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <ErrorBoundary>
      <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Community Cleanups</h1>
      <p className="text-gray-600 mb-4">
        Discover nearby community cleaning campaigns and join in.
      </p>

          {/* Quick Actions */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href="/bookings/new"
              className="bg-white p-3 sm:p-4 rounded-lg shadow border hover:shadow-md transition-shadow"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">📅 New Booking</h3>
              <p className="text-xs sm:text-sm text-gray-600">Schedule a new cleaning or maintenance service</p>
            </Link>

            <Link
              href="/history/customer"
              className="bg-white p-3 sm:p-4 rounded-lg shadow border hover:shadow-md transition-shadow"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">📋 View History</h3>
              <p className="text-xs sm:text-sm text-gray-600">View past bookings and rate services</p>
            </Link>

            <div className="bg-white p-3 sm:p-4 rounded-lg shadow border sm:col-span-2 lg:col-span-1">
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">🔔 Enable Notifications</h3>
              <p className="text-xs sm:text-sm text-gray-600">Stay updated on bookings and campaigns</p>
            </div>
          </div>

      {/* Notification and Location Controls */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <h3 className="text-base sm:text-lg font-semibold mb-2">🔔 Push Notifications</h3>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              Status: <span className={`font-medium ${
                notificationStatus === 'granted' ? 'text-green-600' : 
                notificationStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {notificationStatus === 'granted' ? 'On' : notificationStatus === 'denied' ? 'Off' : 'Unknown'}
              </span>
            </p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              notificationStatus === 'granted' ? 'bg-green-100 text-green-800' : 
              notificationStatus === 'denied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              Notifications {notificationStatus === 'granted' ? 'ON' : 'OFF'} ({process.env.USE_MOCK === '1' ? 'mock' : 'real'})
            </span>
          </div>
          {pushToken && (
            <p className="text-xs text-gray-500 mb-3">
              Token: {pushToken.substring(0, 8)}... • Mode: {pushMode || environment}
            </p>
          )}
          <p className="text-xs text-gray-500 mb-3">
            Stay updated on bookings and nearby campaigns.
          </p>
          {notificationPermission === 'denied' && (
            <p className="text-xs text-red-500 mb-3">
              Permission denied. You can re-enable from your browser settings.
            </p>
          )}
          <div className="space-y-2">
            {notificationStatus !== 'granted' ? (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleDisableNotifications}
                  disabled={isLoading}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 text-sm mr-2"
                >
                  {isLoading ? 'Disabling...' : 'Disable'}
                </button>
                <button
                  onClick={handleTestNotification}
                  disabled={isTestLoading}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 text-sm"
                >
                  {isTestLoading ? 'Sending...' : 'Send Test Notification'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border">
          <h3 className="text-base sm:text-lg font-semibold mb-2">📍 Location Services</h3>
          <p className="text-sm text-gray-600 mb-3">
            Update your location to receive nearby campaign notifications
          </p>
          <div className="space-y-2">
            <button
              onClick={handleUpdateLocation}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 text-sm w-full"
            >
              {isLoading ? 'Updating...' : 'Update Location'}
            </button>
            <button
              onClick={handleTestNotification}
              disabled={isTestLoading}
              className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 disabled:opacity-50 w-full"
            >
              {isTestLoading ? 'Sending...' : 'Notify nearby (test)'}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => location.reload()}
        className="mb-4 inline-flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Refresh
      </button>

      {message && <p className="mb-3 text-sm">{message}</p>}
      {locationStatus && <p className="mb-3 text-sm text-gray-600">{locationStatus}</p>}

      {campaigns.length === 0 ? (
        <p className="text-gray-500">No campaigns yet.</p>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const userAlreadyJoined = c.participants?.includes((user as any).uid) ?? false;
            const statusBadge =
              c.status === 'live'
                ? 'bg-green-100 text-green-800'
                : c.status === 'scheduled'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-200 text-gray-800';

            return (
              <div
                key={c.id}
                className="rounded border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{c.title}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadge}`}>
                    {c.status}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  📍 {c.locationName || 'Unknown area'}
                </p>

                {c.description && (
                  <p className="mt-2 text-sm text-gray-700">{c.description}</p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    👥 {c.joinedCount || 0} joined
                  </p>

                  <button
                    disabled={joiningId === c.id || userAlreadyJoined}
                    onClick={() => handleJoin(c.id)}
                    className={`rounded px-3 py-1 text-sm transition ${
                      userAlreadyJoined
                        ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                        : 'bg-[#1157d3] text-white hover:bg-[#0f4fc0]'
                    }`}
                  >
                    {userAlreadyJoined
                      ? 'Joined'
                      : joiningId === c.id
                      ? 'Joining…'
                      : 'Join campaign'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </main>
    </ErrorBoundary>
  );
}