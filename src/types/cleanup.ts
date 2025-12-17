// === Community Cleanup Service Types ===
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Campaign State: lifecycle of a cleanup campaign
export type CampaignState = 
  | 'forming'      // Campaign is open, accepting participants
  | 'locked'      // Campaign closed for new participants, awaiting provider assignment
  | 'assigned'    // Provider(s) assigned, cleanup scheduled
  | 'completed'   // Cleanup executed successfully
  | 'cancelled';  // Campaign cancelled, refunds processed

// Payment Intent Execution Status
export type PaymentExecutionStatus = 
  | 'pending'     // Payment held, awaiting cleanup execution
  | 'executed'    // Cleanup executed, payment released to provider
  | 'refunded';   // Payment refunded (campaign cancelled/not executed)

// Payment Intent Status (Razorpay integration)
export type PaymentIntentStatus = 
  | 'created'     // Order created in Razorpay
  | 'pending'     // Payment initiated, awaiting capture
  | 'held'        // Payment captured, money held
  | 'captured'    // Cleanup executed, money released to provider
  | 'refunded'    // Auto-refund triggered
  | 'failed';     // Payment failed

// Participant Status
export type ParticipantStatus = 
  | 'active'      // Participant is active in campaign
  | 'cancelled'   // Participant cancelled their participation
  | 'refunded';   // Participant refunded

// Refund Status
export type RefundStatus = 
  | 'none'        // No refund needed
  | 'pending'     // Refund initiated
  | 'completed'   // Refund completed
  | 'failed';     // Refund failed

// ============================================================================
// Firestore Data Models
// ============================================================================

/**
 * CleanupCampaign Document
 * Collection: cleanup_campaigns
 */
export interface CleanupCampaignDoc {
  // Identity
  id: string;  // Auto-generated document ID
  createdBy: string;  // userId (FK: users/{uid})
  
  // Location (fixed pin)
  location: {
    lat: number;
    lng: number;
    address?: string;  // Human-readable address
  };
  
  // Campaign details
  title: string;
  description?: string;
  scheduledDate: Timestamp | Date;  // When cleanup is scheduled
  
  // Pricing state
  basePrice: number;  // ₹649 (constant)
  floorPrice: number;  // ₹99 (constant)
  currentPrice: number;  // Calculated based on participant count
  participantCount: number;  // Denormalized for performance
  
  // Status & lifecycle
  campaignState: CampaignState;  // 'forming' | 'locked' | 'assigned' | 'completed' | 'cancelled'
  status: 'draft' | 'open' | 'closed' | 'assigned' | 'completed' | 'cancelled';  // Legacy status (for compatibility)
  
  // Provider assignment (visible only after assignment)
  assignedProviderId?: string;  // FK: providers/{providerId}
  assignedAt?: Timestamp | Date;
  
  // Trust signals (soft, non-identifying)
  nearbyJoinCount?: number;  // "3 homes nearby joined" (calculated)
  
  // Timestamps
  createdAt: FieldValue | Timestamp | Date;
  updatedAt: FieldValue | Timestamp | Date;
  closedAt?: Timestamp | Date;  // When campaign closed for new participants
  executedAt?: Timestamp | Date;  // When cleanup actually happened
}

/**
 * CampaignParticipant Document
 * Collection: cleanup_campaigns/{campaignId}/participants
 */
export interface CampaignParticipantDoc {
  // Identity
  userId: string;  // FK: users/{uid}
  campaignId: string;  // FK: cleanup_campaigns/{campaignId}
  
  // Payment state
  paymentIntentId: string;  // FK: payment_intents/{paymentIntentId}
  amountPaid: number;  // Amount user paid at join time (in rupees)
  refundStatus: RefundStatus;
  refundedAt?: Timestamp | Date;
  
  // Invitation chain (for trust signals)
  invitedBy?: string;  // userId who invited this participant
  invitedAt?: Timestamp | Date;
  
  // Status
  status: ParticipantStatus;
  
  // Timestamps
  joinedAt: FieldValue | Timestamp | Date;
  updatedAt: FieldValue | Timestamp | Date;
}

/**
 * PaymentIntent Document
 * Collection: payment_intents
 */
export interface PaymentIntentDoc {
  // Identity
  id: string;  // Auto-generated document ID
  userId: string;  // FK: users/{uid}
  campaignId: string;  // FK: cleanup_campaigns/{campaignId}
  
  // Payment details
  amount: number;  // Amount in paise (e.g., 64900 for ₹649)
  currency: 'INR';
  
  // Razorpay integration
  razorpayOrderId?: string;  // Order ID from Razorpay
  razorpayPaymentId?: string;  // Payment ID after capture
  razorpaySignature?: string;  // For verification
  
  // State machine
  status: PaymentIntentStatus;
  executionStatus: PaymentExecutionStatus;  // 'pending' | 'executed' | 'refunded'
  
  // Hold/refund logic
  holdUntil?: Timestamp | Date;  // When to release hold (if cleanup executes)
  autoRefundTrigger?: 'campaign_cancelled' | 'campaign_not_executed' | 'manual';
  refundReason?: string;
  
  // Timestamps
  createdAt: FieldValue | Timestamp | Date;
  updatedAt: FieldValue | Timestamp | Date;
  capturedAt?: Timestamp | Date;
  refundedAt?: Timestamp | Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateCampaignRequest {
  title: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  scheduledDate: string;  // ISO timestamp
}

export interface CreateCampaignResponse {
  ok: boolean;
  campaignId?: string;
  error?: string;
}

export interface JoinCampaignRequest {
  campaignId: string;
  paymentMethod?: 'razorpay';  // Default: razorpay
}

export interface JoinCampaignResponse {
  ok: boolean;
  participantId?: string;
  paymentIntentId?: string;
  razorpayOrderId?: string;  // For client-side checkout
  error?: string;
}

export interface InviteParticipantsRequest {
  campaignId: string;
  userIds: string[];  // Array of user IDs to invite
  message?: string;  // Optional invitation message
}

export interface InviteParticipantsResponse {
  ok: boolean;
  invitedCount?: number;
  error?: string;
}

export interface AssignProvidersRequest {
  campaignId: string;
  providerIds: string[];  // Array of provider IDs
}

export interface AssignProvidersResponse {
  ok: boolean;
  assignedCount?: number;
  error?: string;
}

export interface CancelCampaignRequest {
  campaignId: string;
  reason?: string;
}

export interface CancelCampaignResponse {
  ok: boolean;
  refundedCount?: number;
  error?: string;
}

export interface GetCampaignResponse {
  ok: boolean;
  campaign?: CleanupCampaignDoc;
  isParticipant?: boolean;
  participantCount?: number;
  currentPrice?: number;
  nearbyJoinCount?: number;  // Trust signal
  error?: string;
}

