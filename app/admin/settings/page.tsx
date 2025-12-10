'use client';
import React, { useState, useEffect } from 'react';
import AdminHeader from '../../../components/AdminHeader';
import { getVersionDisplayInfo, getBuildInfo } from '../../../src/lib/version';
import { Info, Smartphone, Globe, Calendar, Code, Shield, ExternalLink } from 'lucide-react';

export default function AdminSettingsPage() {
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@example.com');
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch('/api/version');
        const data = await response.json();
        if (data.ok) {
          setVersionInfo(data.version);
        }
      } catch (error) {
        console.error('Failed to fetch version info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersionInfo();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated (mocked).'); // Later you can link this to Firestore
  };

  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto">
      <AdminHeader title="Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Settings</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* About Section */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            About
          </h2>
          
          {loading ? (
            <div className="space-y-3">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">App Version</p>
                  <p className="font-medium text-gray-900">
                    {versionInfo ? `v${versionInfo.version}` : 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Code className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">App Name</p>
                  <p className="font-medium text-gray-900">
                    {versionInfo ? versionInfo.name : 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Build Date</p>
                  <p className="font-medium text-gray-900">
                    {versionInfo ? versionInfo.buildDate : 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Environment</p>
                  <p className="font-medium text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      versionInfo?.environment === 'production' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {versionInfo ? versionInfo.environment : 'Loading...'}
                    </span>
                  </p>
                </div>
              </div>

              {versionInfo?.androidVersionCode && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Android Build</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Version Code:</span>
                      <span className="font-medium">{versionInfo.androidVersionCode}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Version Name:</span>
                      <span className="font-medium">{versionInfo.androidVersionName}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {versionInfo ? new Date(versionInfo.buildTime).toLocaleString() : 'Loading...'}
                </p>
              </div>

              {/* Privacy Policy Link */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => window.open('/privacy.html', '_blank')}
                  className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Shield className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      Privacy Policy
                    </p>
                    <p className="text-xs text-gray-500">
                      Learn how we collect and protect your data
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}