'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Calendar, Users, DollarSign, Bell, Download } from 'lucide-react';
import { Campaign } from '../../api/campaigns/_types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCampaign, setPendingCampaign] = useState<Campaign | null>(null);
  const [targetedUsers, setTargetedUsers] = useState<number>(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [cleanedTokens, setCleanedTokens] = useState<{count: number, timestamp: string} | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns/list');
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setMessage('Error loading campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`/api/campaigns/delete?id=${campaignId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Campaign deleted successfully');
        loadCampaigns();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setMessage('Error deleting campaign');
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    try {
      const response = await fetch('/api/campaigns/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaignId, status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Campaign status updated successfully');
        loadCampaigns();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
      setMessage('Error updating campaign status');
    }
  };

  const handleNotify = async (campaign: Campaign) => {
    try {
      // First, do a dry run to get the count
      const dryRunResponse = await fetch('/api/push/notify-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          center: campaign.center,
          radiusMeters: campaign.radiusKm * 1000,
          dryRun: true,
        }),
      });
      const dryRunData = await dryRunResponse.json();

      if (!dryRunData.ok) {
        setMessage(`Error: ${dryRunData.error}`);
        return;
      }

      setTargetedUsers(dryRunData.targetedUsers);
      setPendingCampaign(campaign);
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Error checking notification count:', error);
      setMessage('Error checking notification count');
    }
  };

  const handleConfirmNotify = async () => {
    if (!pendingCampaign) return;

    try {
      const response = await fetch('/api/push/notify-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: pendingCampaign.id,
          center: pendingCampaign.center,
          radiusMeters: pendingCampaign.radiusKm * 1000,
        }),
      });
      const data = await response.json();

      if (data.ok) {
        setMessage(`Notifications sent to ${data.sentCount} users`);
        setToastMessage(`✅ Sent ${data.sentCount}/${targetedUsers} notifications`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Show cleaned tokens info if any were removed
        if (data.cleanedTokens > 0) {
          setCleanedTokens({
            count: data.cleanedTokens,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      } else {
        setMessage(`Error: ${data.error}`);
        setToastMessage(`❌ Error: ${data.error}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000); // Longer timeout for error messages
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      setMessage('Error sending notifications');
      setToastMessage('❌ Error sending notifications');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setShowConfirmModal(false);
      setPendingCampaign(null);
    }
  };

  const handleTestPush = async (campaign: Campaign) => {
    try {
      const response = await fetch('/api/push/notify-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          center: campaign.center,
          radiusMeters: 100, // Small radius for test
          test: true, // Test flag
        }),
      });
      const data = await response.json();

      if (data.ok) {
        setMessage(`Test notification sent to ${data.sentCount} users`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('Error sending test notification');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Area', 'Radius (km)', 'Status', 'Created', 'Updated'];
    const csvData = campaigns.map(campaign => [
      campaign.title,
      campaign.areaName,
      campaign.radiusKm,
      campaign.status,
      formatDate(campaign.createdAt),
      formatDate(campaign.updatedAt),
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">Manage cleaning campaigns and local area listings</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Radius
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {campaign.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-1" />
                      {campaign.areaName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {campaign.center.lat.toFixed(4)}, {campaign.center.lng.toFixed(4)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {campaign.radiusKm} km
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={campaign.status}
                      onChange={(e) => handleStatusChange(campaign.id, e.target.value as Campaign['status'])}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(campaign.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleNotify(campaign)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Notify nearby users"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTestPush(campaign)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Send test push"
                      >
                        <span className="text-xs">🧪</span>
                      </button>
                      <button
                        onClick={() => setEditingCampaign(campaign)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit campaign"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No campaigns found</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Create your first campaign
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toastMessage.startsWith('✅') 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {toastMessage}
        </div>
      )}

      {/* Cleaned Tokens Link */}
      {cleanedTokens && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              alert(`Cleaned ${cleanedTokens.count} invalid tokens at ${cleanedTokens.timestamp}`);
              setCleanedTokens(null);
            }}
            className="text-sm hover:underline"
          >
            View cleaned tokens ({cleanedTokens.count} at {cleanedTokens.timestamp})
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Notification Send</h3>
            <p className="text-gray-600 mb-4">
              This will send push notifications to <strong>{targetedUsers}</strong> users within the campaign area.
            </p>
            {targetedUsers > 500 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ This will send to a large number of users ({targetedUsers}). Are you sure?
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNotify}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Campaign</h3>
            <p className="text-gray-600 mb-4">
              Campaign creation form will be implemented here.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}