'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/hooks/useAuth';

export default function CreateCleanupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: {
      lat: 0,
      lng: 0,
      address: '',
    },
    scheduledDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [campaignId, setCampaignId] = useState('');

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: prev.location.address || '',
          },
        }));
        setLoading(false);
      },
      (err) => {
        setError('Failed to get location: ' + err.message);
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check authentication
      if (!user) {
        router.push('/login');
        return;
      }

      // Validate form
      if (!formData.title || !formData.location.lat || !formData.location.lng) {
        setError('Title and location are required');
        setLoading(false);
        return;
      }

      if (!formData.scheduledDate) {
        setError('Scheduled date is required');
        setLoading(false);
        return;
      }

      // Get auth token
      const idToken = await (user as any).getIdToken();

      // Create campaign
      const response = await fetch('/api/cleanup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          location: {
            lat: formData.location.lat,
            lng: formData.location.lng,
            address: formData.location.address || undefined,
          },
          scheduledDate: new Date(formData.scheduledDate).toISOString(),
        }),
      });

      const result = await response.json();

      if (result.ok && result.campaignId) {
        setSuccess(true);
        setCampaignId(result.campaignId);
        // Redirect to campaign page after 2 seconds
        setTimeout(() => {
          router.push(`/cleanup/${result.campaignId}`);
        }, 2000);
      } else {
        setError(result.error || 'Failed to create campaign');
      }
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please log in to create a cleanup campaign</p>
        <button
          onClick={() => router.push('/login')}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Campaign Created!</h1>
        <p>Redirecting to campaign page...</p>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
          Campaign ID: {campaignId}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>Create Community Cleanup</h1>

      {error && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Title <span style={{ color: 'red' }}>*</span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                fontSize: '1rem',
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Description
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                fontSize: '1rem',
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Scheduled Date <span style={{ color: 'red' }}>*</span>
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scheduledDate: e.target.value,
                }))
              }
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.25rem',
                fontSize: '1rem',
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Location <span style={{ color: 'red' }}>*</span>
            <div style={{ marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                {loading ? 'Getting location...' : 'Use Current Location'}
              </button>
              {formData.location.lat !== 0 && formData.location.lng !== 0 && (
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  Lat: {formData.location.lat.toFixed(6)}, Lng:{' '}
                  {formData.location.lng.toFixed(6)}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Address (optional)"
              value={formData.location.address}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, address: e.target.value },
                }))
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                marginTop: '0.5rem',
                fontSize: '1rem',
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create Campaign'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ fontSize: '0.9rem', margin: 0 }}>
          <strong>Note:</strong> Creating a campaign will automatically add you as the first
          participant. Price starts at ₹649 and decreases as more people join (minimum ₹99).
        </p>
      </div>
    </div>
  );
}

