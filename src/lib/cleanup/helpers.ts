// === Community Cleanup Firestore Helpers ===
import { 
  Firestore, 
  CollectionReference, 
  DocumentReference,
  Timestamp,
  FieldValue 
} from 'firebase-admin/firestore';
import { CleanupCampaignDoc, CampaignParticipantDoc, PaymentIntentDoc } from '../../types/cleanup';

/**
 * Get collection reference for cleanup campaigns
 */
export function getCleanupCampaignsCollection(db: Firestore): CollectionReference<CleanupCampaignDoc> {
  return db.collection('cleanup_campaigns') as CollectionReference<CleanupCampaignDoc>;
}

/**
 * Get document reference for a specific cleanup campaign
 */
export function getCleanupCampaignRef(
  db: Firestore, 
  campaignId: string
): DocumentReference<CleanupCampaignDoc> {
  return getCleanupCampaignsCollection(db).doc(campaignId);
}

/**
 * Get participants subcollection for a campaign
 */
export function getCampaignParticipantsCollection(
  db: Firestore,
  campaignId: string
): CollectionReference<CampaignParticipantDoc> {
  return getCleanupCampaignRef(db, campaignId)
    .collection('participants') as CollectionReference<CampaignParticipantDoc>;
}

/**
 * Get document reference for a specific participant
 */
export function getCampaignParticipantRef(
  db: Firestore,
  campaignId: string,
  userId: string
): DocumentReference<CampaignParticipantDoc> {
  return getCampaignParticipantsCollection(db, campaignId).doc(userId);
}

/**
 * Get collection reference for payment intents
 */
export function getPaymentIntentsCollection(db: Firestore): CollectionReference<PaymentIntentDoc> {
  return db.collection('payment_intents') as CollectionReference<PaymentIntentDoc>;
}

/**
 * Get document reference for a specific payment intent
 */
export function getPaymentIntentRef(
  db: Firestore,
  paymentIntentId: string
): DocumentReference<PaymentIntentDoc> {
  return getPaymentIntentsCollection(db).doc(paymentIntentId);
}

/**
 * Create a new cleanup campaign document (without ID, for batch operations)
 */
export function createCleanupCampaignData(
  createdBy: string,
  title: string,
  location: { lat: number; lng: number; address?: string },
  scheduledDate: Date | Timestamp,
  description?: string
): Omit<CleanupCampaignDoc, 'id'> {
  const now = Timestamp.now();
  
  return {
    createdBy,
    location,
    title,
    description,
    scheduledDate,
    basePrice: 649,
    floorPrice: 99,
    currentPrice: 649,  // Initial price for first participant
    participantCount: 0,  // Will be incremented when creator joins
    campaignState: 'forming',
    status: 'open',  // Legacy status for compatibility
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new campaign participant document
 */
export function createCampaignParticipantData(
  userId: string,
  campaignId: string,
  paymentIntentId: string,
  amountPaid: number,
  invitedBy?: string
): Omit<CampaignParticipantDoc, 'id'> {
  const now = Timestamp.now();
  
  return {
    userId,
    campaignId,
    paymentIntentId,
    amountPaid,
    refundStatus: 'none',
    status: 'active',
    joinedAt: now,
    updatedAt: now,
    ...(invitedBy && {
      invitedBy,
      invitedAt: now,
    }),
  };
}

/**
 * Create a new payment intent document
 */
export function createPaymentIntentData(
  userId: string,
  campaignId: string,
  amount: number,  // Amount in paise
  razorpayOrderId?: string
): Omit<PaymentIntentDoc, 'id'> {
  const now = Timestamp.now();
  
  return {
    userId,
    campaignId,
    amount,
    currency: 'INR',
    status: razorpayOrderId ? 'pending' : 'created',
    executionStatus: 'pending',
    createdAt: now,
    updatedAt: now,
    ...(razorpayOrderId && { razorpayOrderId }),
  };
}

/**
 * Helper to get server timestamp
 */
export function getServerTimestamp(): FieldValue {
  return FieldValue.serverTimestamp();
}

/**
 * Helper to check if a campaign is in a state that allows new participants
 */
export function canJoinCampaign(campaign: CleanupCampaignDoc): boolean {
  return campaign.campaignState === 'forming';
}

/**
 * Helper to check if a campaign can be cancelled
 */
export function canCancelCampaign(campaign: CleanupCampaignDoc): boolean {
  return campaign.campaignState === 'forming' || campaign.campaignState === 'locked';
}

/**
 * Helper to check if a campaign has been executed
 */
export function isCampaignExecuted(campaign: CleanupCampaignDoc): boolean {
  return campaign.campaignState === 'completed' || !!campaign.executedAt;
}

