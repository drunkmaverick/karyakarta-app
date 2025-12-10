// === Karyakarta App Types ===
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type Role = 'customer' | 'provider' | 'admin';

// Customer collection
export interface CustomerDoc {
  name: string;
  phone: string;
  email: string;
  area: string;
  active: boolean;
  createdAt: FieldValue | Date;
  updatedAt: FieldValue | Date;
}

// Provider collection
export interface ProviderDoc {
  name: string;
  phone: string;
  areas: string[];
  active: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: FieldValue | Date;
  updatedAt: FieldValue | Date;
}

// Job status types
export type JobStatus = 
  | 'created' 
  | 'pending' 
  | 'confirmed'
  | 'accepted' 
  | 'in_progress' 
  | 'completed' 
  | 'canceled' 
  | 'failed';

// Job collection
export interface JobDoc {
  customerId: string;
  providerId?: string;
  status: JobStatus;
  serviceType: string;
  scheduledFor: Timestamp | Date;
  address: string;
  notes?: string;
  price: number;
  rating?: {
    score: number;
    comment?: string;
    byCustomerId: string;
  };
  createdAt: FieldValue | Date;
  updatedAt: FieldValue | Date;
}

// Payout status types
export type PayoutStatus = 'draft' | 'queued' | 'completed' | 'failed';

// Payout collection
export interface PayoutDoc {
  providerId: string;
  jobId: string;
  amount: number;
  status: PayoutStatus;
  createdAt: FieldValue | Date;
  updatedAt: FieldValue | Date;
  metadata?: any;
}

// Transaction collection
export interface TransactionDoc {
  id: string;
  jobId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  providerId?: string;
  customerId: string;
  paymentProvider: 'razorpay';
  providerOrderId?: string;
  providerPaymentId?: string;
  createdAt: FieldValue | Date;
  updatedAt?: FieldValue | Date;
  metadata?: any;
}

// API Request/Response types

// Customer API types
export interface CreateJobRequest {
  serviceType: string;
  scheduledForISO: string;
  address: string;
  notes?: string;
  price: number;
}

export interface CreateJobResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface JobsByCustomerResponse {
  ok: boolean;
  items?: JobDoc[];
  nextCursor?: string;
  error?: string;
}

export interface RateJobRequest {
  jobId: string;
  score: number; // 1-5
  comment?: string;
}

export interface RateJobResponse {
  ok: boolean;
  error?: string;
}

export interface RepeatJobRequest {
  jobId: string;
  scheduledForISO?: string;
}

export interface RepeatJobResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

// Provider API types
export interface ProviderJobsResponse {
  ok: boolean;
  items?: JobDoc[];
  error?: string;
}

export interface UpdateJobStatusRequest {
  jobId: string;
  to: 'accepted' | 'in_progress' | 'completed';
}

export interface UpdateJobStatusResponse {
  ok: boolean;
  error?: string;
}

export interface ProviderPayoutsResponse {
  ok: boolean;
  items?: PayoutDoc[];
  nextCursor?: string;
  error?: string;
}

// Transaction API types
export interface CreateTransactionRequest {
  jobId: string;
  amount: number;
  currency?: string;
}

export interface CreateTransactionResponse {
  ok: boolean;
  transactionId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface TransactionListResponse {
  ok: boolean;
  items?: TransactionDoc[];
  nextCursor?: string;
  error?: string;
}

export interface WebhookEvent {
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        description: string;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        receipt: string;
        created_at: number;
      };
    };
  };
  created_at: number;
}

// Service types
export const SERVICE_TYPES = [
  'deep_clean',
  'regular_clean',
  'plumbing',
  'electrical',
  'ac_service',
  'carpentry',
  'painting',
  'other'
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

