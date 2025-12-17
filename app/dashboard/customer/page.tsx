'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { useApiError } from '../../../src/hooks/useApiError';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setupPushNotifications, onForegroundMessage, unregisterTokenOnServer, deleteLocalToken } from '../../../src/utils/pushClient';
import { getCurrentLocation } from '../../../src/lib/geo';
import ErrorBoundary from '../../../src/components/ErrorBoundary';


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

  const [fetching, setFetching] = useState(false);
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

    // Campaign listing removed - use /cleanup page instead
    setFetching(false);

    return () => {
      unsubscribeForeground();
    };
  }, [user]);

  // Join functionality moved to /cleanup/[id] page

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
              href="/cleanup/create"
              className="bg-blue-500 text-white p-3 sm:p-4 rounded-lg shadow border hover:shadow-md transition-shadow"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">🌱 Create Community Cleanup</h3>
              <p className="text-xs sm:text-sm text-white/90">Start a new neighborhood cleanup campaign</p>
            </Link>

            <Link
              href="/cleanup"
              className="bg-white p-3 sm:p-4 rounded-lg shadow border hover:shadow-md transition-shadow"
            >
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">🔍 Join Nearby Cleanups</h3>
              <p className="text-xs sm:text-sm text-gray-600">Find and join cleanup campaigns in your area</p>
            </Link>

            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg shadow border opacity-60 cursor-not-allowed">
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">🧼 On-demand Maid Service</h3>
              <p className="text-xs sm:text-sm text-gray-600">Coming Soon</p>
            </div>

            <div className="bg-gray-100 p-3 sm:p-4 rounded-lg shadow border opacity-60 cursor-not-allowed">
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">👴 Private Elderly Concierge</h3>
              <p className="text-xs sm:text-sm text-gray-600">Coming Soon</p>
            </div>

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
      </main>
    </ErrorBoundary>
  );
}