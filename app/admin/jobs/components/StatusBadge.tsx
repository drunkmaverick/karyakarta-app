'use client';

import React from 'react';

type JobStatus = 'created' | 'open' | 'in_progress' | 'completed' | 'canceled' | 'failed';

const LABELS: Record<JobStatus, string> = {
  created: 'Created',
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  canceled: 'Canceled',
  failed: 'Failed',
};

const CLASSES: Record<JobStatus, string> = {
  created:
    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  open:
    'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
  in_progress:
    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  completed:
    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  canceled:
    'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
  failed:
    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  const label = LABELS[status] ?? status;
  const klass = CLASSES[status] ?? 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${klass}`}>
      {label}
    </span>
  );
}