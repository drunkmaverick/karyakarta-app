// === Karyakarta data shapes ===
export type Role = 'customer' | 'service_provider' | 'dispatcher' | 'admin';

export interface UserDoc {
  displayName: string;
  phone: string;
  roles: Record<Role, boolean>; // e.g. { customer: true }
  areaId?: string;               // pin/ward mapping
  createdAt: FirebaseFirestore.FieldValue | Date;
}

export interface ServiceProviderDoc {
  userId: string;                // FK: users/{uid}
  kycStatus: 'pending' | 'verified' | 'rejected';
  skills: string[];              // ['plumbing','ac_service']
  areaId: string;
  rating: number;                // 0..5
  available: boolean;
  createdAt: FirebaseFirestore.FieldValue | Date;
}

export type JobStatus =
  | 'created'
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'accepted'
  | 'enroute'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface JobDoc {
  customerId: string;            // uid
  areaId: string;                // routing key
  spId?: string;                 // service_providers/{spId}
  service: string;               // e.g., 'deep_cleaning'
  priceQuoted: number;           // server-set
  priceFinal?: number;           // server-set on completion
  scheduledAt?: FirebaseFirestore.Timestamp | Date;
  status: JobStatus;
  createdAt: FirebaseFirestore.FieldValue | Date;
  updatedAt: FirebaseFirestore.FieldValue | Date;
}

export interface JobEventDoc {
  jobId: string;                 // jobs/{jobId}
  actorId: string;               // uid or 'system'
  from?: JobStatus;
  to: JobStatus;
  at: FirebaseFirestore.FieldValue | Date;
  note?: string;
}

export interface PayoutDoc {
  spId: string;                  // service_providers/{spId}
  jobId: string;                 // jobs/{jobId}
  amount: number;
  createdAt: FirebaseFirestore.FieldValue | Date;
  createdBy: string;             // uid or 'system'
}