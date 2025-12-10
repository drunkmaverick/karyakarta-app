'use client';
import React from 'react';
import { ExternalLink, Shield } from 'lucide-react';

export default function DevFooter() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const reviewerToken = process.env.NEXT_PUBLIC_REVIEWER_TOKEN;
  if (!reviewerToken) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <a
        href={`/reviewer-info?token=${reviewerToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        title="Reviewer Information (Development Only)"
      >
        <Shield className="h-4 w-4 mr-2" />
        Reviewer Info
        <ExternalLink className="h-3 w-3 ml-2" />
      </a>
    </div>
  );
}
