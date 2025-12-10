'use client';

import React, { useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { useNetwork } from '../../src/hooks/useNetwork';

export default function OfflineBar() {
  const { isOnline, isConnecting } = useNetwork();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if online, connecting, or dismissed
  if (isOnline || isConnecting || isDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium shadow-md">
      <div className="flex items-center justify-center">
        <WifiOff className="w-4 h-4 mr-2" />
        <span>You're offline — some actions are disabled.</span>
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-4 text-yellow-200 hover:text-white transition-colors"
          aria-label="Dismiss offline notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
