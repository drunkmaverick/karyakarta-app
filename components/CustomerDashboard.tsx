'use client';

import { useState, useEffect } from 'react';
import { auth } from '../src/lib/firebaseClient';
import { requestNotificationPermission, onForegroundMessage } from '../src/lib/firebaseClient';
import { getCurrentLocation } from '../src/lib/geo';

interface CustomerDashboardProps {
  className?: string;
}

export default function CustomerDashboard({ className = '' }: CustomerDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Check notification permission
    if (typeof window !== 'undefined') {
      setNotificationStatus(Notification.permission as 'granted' | 'denied' | 'unknown');
    }

    // Listen for foreground messages
    const unsubscribeForeground = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
      // You could show a toast notification here
    });

    return () => {
      unsubscribe();
      unsubscribeForeground();
    };
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();
      
      if (token && user) {
        // Register token with backend
        const idToken = await user.getIdToken();
        const response = await fetch('/api/push/register-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();
        
        if (result.ok) {
          setNotificationStatus('granted');
          setLocationStatus('Notifications enabled successfully!');
        } else {
          setLocationStatus(`Error: ${result.error}`);
        }
      } else {
        setNotificationStatus('denied');
        setLocationStatus('Notification permission denied');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setLocationStatus('Error enabling notifications');
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
      
      if (location && user) {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/customers/update-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(location),
        });

        const result = await response.json();
        
        if (result.ok) {
          setLocationStatus(`Location updated: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
        } else {
          setLocationStatus(`Error: ${result.error}`);
        }
      } else {
        setLocationStatus('Location access denied or unavailable. Please enable location access in your browser settings.');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setLocationStatus('Error updating location');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={`p-6 ${className}`}>
        <h2 className="text-2xl font-bold mb-4">Customer Dashboard</h2>
        <p>Please sign in to access your dashboard.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-4">Welcome, {user.email}</h2>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Push Notifications</h3>
          <p className="text-sm text-gray-600 mb-3">
            Status: <span className={`font-medium ${
              notificationStatus === 'granted' ? 'text-green-600' : 
              notificationStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {notificationStatus}
            </span>
          </p>
          {notificationStatus !== 'granted' && (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Location Services</h3>
          <p className="text-sm text-gray-600 mb-3">
            Update your location to receive nearby campaign notifications
          </p>
          <button
            onClick={handleUpdateLocation}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Location'}
          </button>
        </div>

        {locationStatus && (
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm">{locationStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
}

