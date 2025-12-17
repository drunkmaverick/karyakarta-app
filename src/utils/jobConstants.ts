// PASTE HERE JOB_STATUSES
export const JOB_STATUSES = {
  CREATED: 'created',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  ENROUTE: 'enroute',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

// PASTE HERE KYC_STATUSES
export const KYC_STATUSES = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
} as const;

// PASTE HERE SERVICE_TYPES
// Note: Only Community Cleanup is active. Maid Service and Elderly Concierge are coming soon.
export const SERVICE_TYPES = [
  'deep_cleaning',
  'maid_service' // Coming soon
] as const;









































