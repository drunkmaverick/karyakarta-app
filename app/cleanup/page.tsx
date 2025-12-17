'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/hooks/useAuth';
import Link from 'next/link';

interface Campaign {
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
}

export default function CleanupListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        // TODO: Implement API route to list campaigns
        // For now, show empty state
        setCampaigns([]);
      } catch (err: any) {
        console.error('Error fetching campaigns:', err);
        setError('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (authLoading || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Nearby Community Cleanups</h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            Find and join cleanup campaigns in your area
          </p>
        </div>
        {user && (
          <Link
            href="/cleanup/create"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Create Campaign
          </Link>
        )}
      </div>

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

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No cleanup campaigns found</p>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Be the first to start a cleanup in your neighborhood!
          </p>
          {user ? (
            <Link
              href="/cleanup/create"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
              }}
            >
              Create Your First Campaign
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
              }}
            >
              Login to Create Campaign
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/cleanup/${campaign.id}`}
              style={{
                display: 'block',
                padding: '1.5rem',
                backgroundColor: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>{campaign.title}</h2>
                  {campaign.description && (
                    <p style={{ color: '#666', marginBottom: '1rem' }}>{campaign.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    <span>📍 {campaign.location.address || 'Location'}</span>
                    <span>👥 {campaign.participantCount} participants</span>
                    <span>💰 ₹{campaign.currentPrice}</span>
                  </div>
                </div>
                <div
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: campaign.campaignState === 'forming' ? '#e3f2fd' : '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: campaign.campaignState === 'forming' ? '#1976d2' : '#666',
                  }}
                >
                  {campaign.campaignState}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


