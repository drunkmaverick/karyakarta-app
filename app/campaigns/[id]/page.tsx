'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Calendar, Users, DollarSign, Clock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Campaign } from '../../api/campaigns/_types';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params?.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showAfterClean, setShowAfterClean] = useState(false);
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/get?id=${campaignId}`);
      const data = await response.json();
      
      if (data.success) {
        setCampaign(data.campaign);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      setMessage('Error loading campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async () => {
    if (!campaign) return;
    
    try {
      // In a real implementation, this would call an API to register interest
      setIsInterested(true);
      setMessage('Thank you for your interest! We\'ll notify you about updates.');
    } catch (error) {
      console.error('Error registering interest:', error);
      setMessage('Error registering interest');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
            <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
            <Link
              href="/campaigns"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/campaigns"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Link>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Image with Overlay Toggle */}
          <div className="relative h-96 bg-gradient-to-r from-blue-500 to-green-500">
            {campaign.imageUrl ? (
              <>
                <img
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
                
                {/* After-clean overlay */}
                {showAfterClean && campaign.afterImageUrl && (
                  <img
                    src={campaign.afterImageUrl}
                    alt={`${campaign.title} - After`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <MapPin className="w-16 h-16 mx-auto mb-4" />
                  <div className="text-xl font-semibold">Community Cleanup</div>
                </div>
              </div>
            )}

            {/* Overlay Toggle Button */}
            {campaign.afterImageUrl && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowAfterClean(!showAfterClean)}
                  className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-70 transition-all"
                >
                  {showAfterClean ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide After
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show After
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {campaign.title}
                </h1>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{campaign.areaName} ({campaign.radiusKm}km radius)</span>
                </div>
              </div>
            </div>

            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 text-lg leading-relaxed">
                {campaign.description}
              </p>
            </div>

            {/* Campaign Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Area: {campaign.areaName}</div>
                  <div>Radius: {campaign.radiusKm} km</div>
                  <div>Center: {campaign.center.lat.toFixed(4)}, {campaign.center.lng.toFixed(4)}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Campaign Info
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Created: {formatDate(campaign.createdAt)}</div>
                  <div>Join your neighbors in making a difference</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleInterest}
                disabled={isInterested}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                  isInterested
                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isInterested
                  ? '✓ You\'re Interested!'
                  : 'I\'m Interested'
                }
              </button>
              
              <button className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                Share Campaign
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">What to Expect</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Bring your own cleaning supplies (gloves, trash bags, etc.)</li>
                <li>• Wear comfortable clothes and closed-toe shoes</li>
                <li>• We'll provide refreshments and community bonding time</li>
                <li>• All skill levels welcome - we'll work together!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}