'use client';

import { Payout } from '../types';

interface StatusBadgeProps {
  status: Payout['status'];
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusConfig = (status: Payout['status']) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
      case 'processing':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
      case 'completed':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
      case 'failed':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
      case 'canceled':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


































