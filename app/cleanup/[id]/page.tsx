'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../src/hooks/useAuth';

interface CampaignData {
  id: string;
  title: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  scheduledDate: string;
  currentPrice: number;
  participantCount: number;
  campaignState: string;
  createdBy: string;
  basePrice: number;
  floorPrice: number;
}

export default function CleanupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;
  const { user, loading: authLoading } = useAuth();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isParticipant, setIsParticipant] = useState(false);

  // Fetch campaign data
  useEffect(() => {
    if (!campaignId) return;

    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cleanup/${campaignId}`);
        const result = await response.json();

        if (result.ok && result.campaign) {
          setCampaign(result.campaign);
          // TODO: Check if user is participant (Phase 2)
          setIsParticipant(false);
        } else {
          setError(result.error || 'Failed to load campaign');
        }
      } catch (err: any) {
        console.error('Error fetching campaign:', err);
        setError('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();

    // Poll for updates every 5 seconds to see price changes
    const interval = setInterval(fetchCampaign, 5000);
    return () => clearInterval(interval);
  }, [campaignId]);

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setJoining(true);
    setError('');
    setSuccess('');

    try {
      const idToken = await (user as any).getIdToken();

      const response = await fetch('/api/cleanup/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          campaignId,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        setSuccess('Successfully joined! Price updated.');
        setIsParticipant(true);
        // Refresh campaign data to show updated price and participant count
        setTimeout(async () => {
          const refreshResponse = await fetch(`/api/cleanup/${campaignId}`);
          const refreshResult = await refreshResponse.json();
          if (refreshResult.ok) {
            setCampaign(refreshResult.campaign);
          }
        }, 500);
      } else {
        setError(result.error || 'Failed to join campaign');
      }
    } catch (err: any) {
      console.error('Error joining campaign:', err);
      setError(err.message || 'Failed to join campaign');
    } finally {
      setJoining(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading campaign...</p>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Error</h1>
        <p>{error}</p>
        <button
          onClick={() => router.push('/')}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Campaign not found</p>
        <button
          onClick={() => router.push('/')}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  const scheduledDate = new Date(campaign.scheduledDate);
  const formattedDate = scheduledDate.toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <button
        onClick={() => router.push('/')}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          fontSize: '0.9rem',
        }}
      >
        ← Back
      </button>

      <h1>{campaign.title}</h1>

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

      {success && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px',
            color: '#0c0',
          }}
        >
          {success}
        </div>
      )}

      {campaign.description && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p>{campaign.description}</p>
        </div>
      )}

      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <strong>Scheduled:</strong> {formattedDate}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Location:</strong>{' '}
          {campaign.location.address ||
            `${campaign.location.lat.toFixed(6)}, ${campaign.location.lng.toFixed(6)}`}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Status:</strong> {campaign.campaignState}
        </div>
      </div>

      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '2px solid #2196f3',
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          <strong>Current Price: ₹{campaign.currentPrice}</strong>
        </div>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          <strong>Participants: {campaign.participantCount}</strong>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          Base: ₹{campaign.basePrice} → Floor: ₹{campaign.floorPrice}
        </div>
        {campaign.participantCount > 1 && (
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            Price dropped by ₹{campaign.basePrice - campaign.currentPrice} as more
            people joined!
          </div>
        )}
      </div>

      {campaign.campaignState === 'forming' && (
        <div>
          {isParticipant ? (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#efe',
                border: '1px solid #cfc',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                ✓ You're in! Payment will be processed when campaign locks.
              </p>
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining || !user}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                backgroundColor: joining || !user ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: joining || !user ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              {joining
                ? 'Joining...'
                : !user
                ? 'Login to Join'
                : `Join for ₹${campaign.currentPrice}`}
            </button>
          )}
        </div>
      )}

      {campaign.campaignState !== 'forming' && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0 }}>
            This campaign is {campaign.campaignState} and not accepting new
            participants.
          </p>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ fontSize: '0.9rem', margin: 0 }}>
          <strong>How it works:</strong> Price starts at ₹649 and decreases as more
          people join. Minimum price is ₹99. Payment is held until the cleanup is
          executed, then automatically refunded if it doesn't happen.
        </p>
      </div>
    </div>
  );
}

