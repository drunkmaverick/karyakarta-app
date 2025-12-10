'use client';

import { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, DollarSign, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { Campaign } from '../api/campaigns/_types';
import EmptyState from '../../components/ui/EmptyState';
import { GridSkeleton } from '../../components/ui/LoadingSkeleton';
import ErrorState from '../../components/ui/ErrorState';
import { useUIState } from '../../src/hooks/useUIState';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const uiState = useUIState();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    uiState.setLoading(true);
    uiState.setError(null);
    
    try {
      const response = await fetch('/api/campaigns/list');
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        const errorMsg = data.error || 'Failed to load campaigns';
        uiState.setError(errorMsg);
        uiState.showErrorToast(errorMsg, 'Failed to load campaigns');
      }
    } catch (error) {
      const errorMsg = 'Error loading campaigns. Please check your connection.';
      console.error('Error loading campaigns:', error);
      uiState.setError(errorMsg);
      uiState.showErrorToast(errorMsg, 'Network Error');
    } finally {
      uiState.setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (uiState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8 animate-pulse"></div>
          <GridSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (uiState.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorState
            message={uiState.error}
            onRetry={loadCampaigns}
            retryCount={uiState.retryCount}
            isOffline={uiState.isOffline}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Community Cleaning Campaigns
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join local cleaning campaigns in your area and make a difference in your community
          </p>
        </div>

        {uiState.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center">
            {uiState.error}
          </div>
        )}

        {campaigns.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No campaigns yet"
            description="No campaigns are currently available. Check back later for new opportunities!"
            action={{
              label: "Refresh",
              onClick: loadCampaigns
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Hero Image */}
                <div className="h-48 bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                  {campaign.imageUrl ? (
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white text-center">
                      <MapPin className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm font-medium">Community Cleanup</div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {campaign.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {campaign.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{campaign.areaName} ({campaign.radiusKm}km radius)</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Created: {formatDate(campaign.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="flex-1 bg-blue-500 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      View Details
                    </Link>
                    <button className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                      I'm Interested
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}