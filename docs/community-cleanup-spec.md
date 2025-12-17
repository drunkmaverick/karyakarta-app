# Community Cleanup Service - Phase 1 Architecture

## Overview

**Goal**: Build a production-ready, minimal, reliable implementation of the Community Cleanup flow that prioritizes trust-building over profit.

**Core Principles**:
- Trust-first, not profit-first
- Minimum group size = 1 (users can start alone)
- Upfront payment with auto-refund if cleanup doesn't execute
- Fixed location pin (no radius-based matching)
- Provider details visible only after assignment
- Soft trust signals (e.g., "3 homes nearby joined")

---

## System Architecture

### 1. Data Models (Firestore Collections)

#### 1.1 User Model
**Collection**: `users` (extends existing)

```typescript
interface UserDoc {
  // Existing fields
  displayName: string;
  phone: string;
  email?: string;
  roles: Record<Role, boolean>;
  areaId?: string;
  createdAt: Timestamp;
  
  // Community cleanup additions
  cleanupCampaigns?: string[];  // Array of campaign IDs user has joined
  location?: {
    lat: number;
    lng: number;
    updatedAt: Timestamp;
  };
}
```

**Notes**:
- Reuses existing `users` collection
- Adds optional cleanup-specific fields
- Location stored for trust signal calculations

---

#### 1.2 CleanupCampaign Model
**Collection**: `cleanup_campaigns`

```typescript
interface CleanupCampaignDoc {
  // Identity
  id: string;  // Auto-generated
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
  scheduledDate: Timestamp;  // When cleanup is scheduled
  
  // Pricing state
  basePrice: number;  // ₹649 (constant)
  floorPrice: number;  // ₹99 (constant)
  currentPrice: number;  // Calculated based on participant count
  participantCount: number;  // Denormalized for performance
  
  // Status & lifecycle
  status: 'draft' | 'open' | 'closed' | 'assigned' | 'completed' | 'cancelled';
  
  // Provider assignment (visible only after assignment)
  assignedProviderId?: string;  // FK: providers/{providerId}
  assignedAt?: Timestamp;
  
  // Trust signals (soft, non-identifying)
  nearbyJoinCount?: number;  // "3 homes nearby joined" (calculated)
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt?: Timestamp;  // When campaign closed for new participants
  executedAt?: Timestamp;  // When cleanup actually happened
}
```

**Indexes Required**:
- `status` (ascending)
- `location.lat`, `location.lng` (for nearby queries)
- `scheduledDate` (ascending)
- `createdAt` (descending)

---

#### 1.3 CampaignParticipant Model
**Collection**: `campaign_participants` (subcollection: `cleanup_campaigns/{campaignId}/participants`)

```typescript
interface CampaignParticipantDoc {
  // Identity
  userId: string;  // FK: users/{uid}
  campaignId: string;  // FK: cleanup_campaigns/{campaignId}
  
  // Payment state
  paymentIntentId: string;  // FK: payment_intents/{paymentIntentId}
  amountPaid: number;  // Amount user paid at join time
  refundStatus: 'none' | 'pending' | 'completed' | 'failed';
  refundedAt?: Timestamp;
  
  // Invitation chain (for trust signals)
  invitedBy?: string;  // userId who invited this participant
  invitedAt?: Timestamp;
  
  // Status
  status: 'active' | 'cancelled' | 'refunded';
  
  // Timestamps
  joinedAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Notes**:
- Subcollection for efficient querying
- Payment amount stored at join time (price may change)
- Refund tracking for auto-refund logic

---

#### 1.4 PaymentIntent Model
**Collection**: `payment_intents`

```typescript
interface PaymentIntentDoc {
  // Identity
  id: string;  // Auto-generated
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
  status: 'created' | 'pending' | 'held' | 'captured' | 'refunded' | 'failed';
  
  // Hold/refund logic
  holdUntil?: Timestamp;  // When to release hold (if cleanup executes)
  autoRefundTrigger?: 'campaign_cancelled' | 'campaign_not_executed' | 'manual';
  refundReason?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  capturedAt?: Timestamp;
  refundedAt?: Timestamp;
}
```

**State Flow**:
1. `created` → Order created in Razorpay
2. `pending` → Payment initiated, awaiting capture
3. `held` → Payment captured, money held
4. `captured` → Cleanup executed, money released to provider
5. `refunded` → Auto-refund triggered (campaign cancelled/not executed)
6. `failed` → Payment failed

---

### 2. Pricing Logic

#### 2.1 Price Calculation Function

```typescript
/**
 * Calculates price per participant based on current participant count.
 * 
 * Formula: Linear decay from basePrice to floorPrice
 * - Base: ₹649 (1 participant)
 * - Floor: ₹99 (max participants)
 * - Decay rate: (649 - 99) / (maxParticipants - 1)
 * 
 * @param participantCount - Current number of participants (min: 1)
 * @param basePrice - Starting price (₹649)
 * @param floorPrice - Minimum price (₹99)
 * @param maxParticipants - Theoretical max for calculation (e.g., 20)
 * @returns Price per participant in rupees
 */
function calculatePrice(
  participantCount: number,
  basePrice: number = 649,
  floorPrice: number = 99,
  maxParticipants: number = 20
): number {
  // Ensure minimum 1 participant
  const count = Math.max(1, participantCount);
  
  // If at or above max, return floor price
  if (count >= maxParticipants) {
    return floorPrice;
  }
  
  // Linear interpolation
  const priceRange = basePrice - floorPrice;
  const participantRange = maxParticipants - 1;
  const discountPerParticipant = priceRange / participantRange;
  
  const calculatedPrice = basePrice - (discountPerParticipant * (count - 1));
  
  // Ensure price doesn't go below floor
  return Math.max(floorPrice, Math.round(calculatedPrice));
}
```

**Example Prices**:
- 1 participant: ₹649
- 2 participants: ₹620
- 5 participants: ₹471
- 10 participants: ₹285
- 15 participants: ₹149
- 20+ participants: ₹99

**Properties**:
- Deterministic (same count = same price)
- Explainable (linear decay formula)
- No magic numbers (all parameters configurable)

---

#### 2.2 Price Update on Join

When a new participant joins:
1. Calculate new price: `newPrice = calculatePrice(participantCount + 1)`
2. Update `cleanup_campaigns/{campaignId}`:
   - `currentPrice = newPrice`
   - `participantCount += 1`
3. Store participant's paid amount: `amountPaid = currentPrice` (at join time)

**Note**: Existing participants keep their original price. Only new participants pay the updated price.

---

### 3. API Routes

#### 3.1 POST `/api/cleanup/create`
**Purpose**: Create a new cleanup campaign

**Request**:
```typescript
interface CreateCampaignRequest {
  title: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  scheduledDate: string;  // ISO timestamp
}
```

**Response**:
```typescript
interface CreateCampaignResponse {
  ok: boolean;
  campaignId?: string;
  error?: string;
}
```

**Logic**:
1. Authenticate user (requireCustomer)
2. Validate location (lat/lng required)
3. Create campaign document:
   - `status = 'open'`
   - `basePrice = 649`, `floorPrice = 99`
   - `currentPrice = 649` (1 participant)
   - `participantCount = 0` (will be 1 after creator joins)
4. Create participant document for creator
5. Return campaign ID

**Guardrails**:
- Validate lat/lng are valid numbers
- Ensure scheduledDate is in future
- Prevent duplicate campaigns at same location (optional)

---

#### 3.2 POST `/api/cleanup/join`
**Purpose**: Join an existing campaign and process payment

**Request**:
```typescript
interface JoinCampaignRequest {
  campaignId: string;
  paymentMethod?: 'razorpay';  // Default: razorpay
}
```

**Response**:
```typescript
interface JoinCampaignResponse {
  ok: boolean;
  participantId?: string;
  paymentIntentId?: string;
  razorpayOrderId?: string;  // For client-side checkout
  error?: string;
}
```

**Logic**:
1. Authenticate user (requireCustomer)
2. Fetch campaign (validate `status === 'open'`)
3. Check if user already joined (prevent duplicates)
4. Calculate new price: `newPrice = calculatePrice(participantCount + 1)`
5. Create payment intent:
   - `status = 'created'`
   - `amount = newPrice * 100` (convert to paise)
6. Create Razorpay order
7. Update payment intent with `razorpayOrderId`
8. Create participant document (status: 'active')
9. Update campaign:
   - `participantCount += 1`
   - `currentPrice = newPrice`
10. Return payment details for client-side checkout

**Guardrails**:
- Prevent duplicate joins (check existing participant)
- Validate campaign is open
- Handle concurrent joins (use Firestore transactions)

---

#### 3.3 POST `/api/cleanup/invite`
**Purpose**: Invite users to join a campaign

**Request**:
```typescript
interface InviteParticipantsRequest {
  campaignId: string;
  userIds: string[];  // Array of user IDs to invite
  message?: string;  // Optional invitation message
}
```

**Response**:
```typescript
interface InviteParticipantsResponse {
  ok: boolean;
  invitedCount?: number;
  error?: string;
}
```

**Logic**:
1. Authenticate user (requireCustomer)
2. Verify user is participant in campaign
3. Validate userIds (must be valid users)
4. Send push notifications (TODO: integrate with notification service)
5. Store invitation records (optional: `invitations` subcollection)
6. Return success

**Guardrails**:
- Limit invitation batch size (e.g., max 50)
- Prevent self-invitation
- Rate limit invitations per user

---

#### 3.4 POST `/api/cleanup/assign-providers`
**Purpose**: Assign provider(s) to campaign (STUB - Phase 2)

**Request**:
```typescript
interface AssignProvidersRequest {
  campaignId: string;
  providerIds: string[];  // Array of provider IDs
}
```

**Response**:
```typescript
interface AssignProvidersResponse {
  ok: boolean;
  assignedCount?: number;
  error?: string;
}
```

**Logic** (Stub):
1. Authenticate admin (requireAdmin)
2. Validate campaign exists and is in 'closed' or 'assigned' status
3. TODO: Implement provider matching logic
4. Update campaign:
   - `assignedProviderId = providerIds[0]` (or first provider)
   - `status = 'assigned'`
   - `assignedAt = now()`
5. Return success

**Notes**:
- This is a stub for Phase 2
- Provider details visible only after assignment
- Multiple providers support (future)

---

#### 3.5 POST `/api/cleanup/cancel`
**Purpose**: Cancel a campaign and trigger auto-refunds

**Request**:
```typescript
interface CancelCampaignRequest {
  campaignId: string;
  reason?: string;
}
```

**Response**:
```typescript
interface CancelCampaignResponse {
  ok: boolean;
  refundedCount?: number;
  error?: string;
}
```

**Logic**:
1. Authenticate user (requireCustomer - must be creator) OR admin
2. Fetch campaign (validate can be cancelled)
3. Update campaign: `status = 'cancelled'`
4. Fetch all participants
5. For each participant with `status = 'active'`:
   - Find payment intent
   - If `status = 'held'`:
     - Trigger Razorpay refund
     - Update payment intent: `status = 'refunded'`, `autoRefundTrigger = 'campaign_cancelled'`
     - Update participant: `refundStatus = 'pending'` → 'completed'
6. Return refund count

**Guardrails**:
- Only creator or admin can cancel
- Prevent cancellation if cleanup already executed
- Handle partial refund failures gracefully

---

#### 3.6 GET `/api/cleanup/[id]`
**Purpose**: Get campaign details

**Response**:
```typescript
interface GetCampaignResponse {
  ok: boolean;
  campaign?: CleanupCampaignDoc;
  isParticipant?: boolean;
  participantCount?: number;
  currentPrice?: number;
  nearbyJoinCount?: number;  // Trust signal
  error?: string;
}
```

**Logic**:
1. Authenticate user (optional - public campaigns)
2. Fetch campaign document
3. Calculate `nearbyJoinCount` (users within ~500m who joined)
4. Check if user is participant
5. Return campaign + metadata

**Guardrails**:
- Hide provider details if `status !== 'assigned'`
- Calculate trust signals on-demand (cached if needed)

---

### 4. UI Routes

#### 4.1 `/` (Home)
**Purpose**: Landing page with campaign discovery

**Components**:
- Hero section
- Active campaigns list
- "Start a Cleanup" CTA

**Data**:
- Fetch open campaigns (limit 10)
- Show trust signals (participant count, nearby joins)

---

#### 4.2 `/login`
**Purpose**: User authentication (existing)

**Notes**: Reuse existing login page

---

#### 4.3 `/dashboard/customer`
**Purpose**: Customer dashboard

**Components**:
- My campaigns (created + joined)
- Campaign status cards
- Payment status indicators

**Data**:
- Fetch user's campaigns
- Fetch user's participants
- Show refund status if applicable

---

#### 4.4 `/cleanup/create`
**Purpose**: Create new cleanup campaign

**Components**:
- Location picker (map with pin)
- Title/description form
- Scheduled date picker
- Price preview (starts at ₹649)

**Flow**:
1. User selects location (fixed pin)
2. Fills campaign details
3. Submits → creates campaign
4. Redirects to `/cleanup/[id]` with payment flow

**Guardrails**:
- Validate location is selected
- Prevent duplicate submissions (disable button after submit)

---

#### 4.5 `/cleanup/[id]`
**Purpose**: Campaign detail page

**Components**:
- Campaign info card
- Location map
- Participant count + price
- Trust signals ("3 homes nearby joined")
- Join button (if not participant)
- Payment flow (Razorpay checkout)
- Provider details (only if assigned)

**States**:
- Loading: Show skeleton
- Empty: Show "Campaign not found"
- Joined: Show "You're in!" + payment status
- Assigned: Show provider details

**Guardrails**:
- Prevent infinite renders (use React.memo, useMemo)
- Defensive null handling (optional chaining)
- Clear loading states (skeleton UI)

---

### 5. Guardrails & Best Practices

#### 5.1 Prevent Infinite Renders
- Use `React.memo` for expensive components
- Use `useMemo` for derived data
- Use `useCallback` for event handlers passed to children
- Avoid setting state in render

#### 5.2 Defensive Null Handling
- Use optional chaining (`?.`) for nested access
- Provide default values (`??`)
- Validate API responses before rendering
- Type guards for runtime validation

#### 5.3 Loading & Empty States
- Skeleton loaders for async data
- Empty state messages ("No campaigns yet")
- Error boundaries for graceful failures
- Retry mechanisms for failed requests

#### 5.4 Payment Security
- Never store payment details client-side
- Verify Razorpay signatures server-side
- Use idempotency keys for payment intents
- Log all payment state transitions

#### 5.5 Data Consistency
- Use Firestore transactions for concurrent updates
- Denormalize participant count (single source of truth)
- Handle race conditions (e.g., simultaneous joins)

---

### 6. Integration Points (TODOs)

#### 6.1 Provider Assignment (Phase 2)
- TODO: Implement provider matching algorithm
- TODO: Distance-based provider selection
- TODO: Provider availability checks

#### 6.2 Notification Service
- TODO: Push notifications for invitations
- TODO: Campaign status updates
- TODO: Payment confirmations

#### 6.3 Analytics
- TODO: Track campaign creation
- TODO: Track join rates
- TODO: Track price sensitivity

#### 6.4 Auto-Refund Cron Job
- TODO: Scheduled job to check for non-executed campaigns
- TODO: Trigger refunds after scheduled date + grace period
- TODO: Email notifications for refunds

---

### 7. File Structure

```
app/
  api/
    cleanup/
      create/
        route.ts
      join/
        route.ts
      invite/
        route.ts
      assign-providers/
        route.ts
      cancel/
        route.ts
      [id]/
        route.ts
  cleanup/
    create/
      page.tsx
    [id]/
      page.tsx
  dashboard/
    customer/
      page.tsx  # (update existing)

src/
  lib/
    cleanup/
      pricing.ts  # Price calculation logic
      validation.ts  # Campaign validation
  types/
    cleanup.ts  # TypeScript interfaces

docs/
  community-cleanup-spec.md  # This file
```

---

### 8. Testing Strategy

#### 8.1 Unit Tests
- Price calculation function
- Validation logic
- State transitions

#### 8.2 Integration Tests
- API route handlers
- Payment flow (mock Razorpay)
- Firestore operations

#### 8.3 E2E Tests
- Create campaign flow
- Join campaign + payment
- Cancel + refund flow

---

### 9. Deployment Checklist

- [ ] Firestore indexes created
- [ ] Firestore security rules updated
- [ ] Razorpay webhook endpoint configured
- [ ] Environment variables set
- [ ] Error tracking (Sentry) configured
- [ ] Analytics tracking enabled

---

## Next Steps

1. **Review & Approve Architecture** ✅ (This document)
2. **Implement Data Models** (TypeScript interfaces + Firestore schemas)
3. **Implement Pricing Logic** (Pure function, unit tested)
4. **Implement API Routes** (Incremental: create → join → cancel)
5. **Implement UI Routes** (Incremental: create → detail → dashboard)
6. **Add Guardrails** (Error handling, loading states)
7. **Integration Testing** (Full flow)
8. **Deploy to Staging** (Test with real Razorpay test mode)

---

## Questions & Decisions

### Open Questions:
1. **Max participants**: What's the theoretical max? (Using 20 for calculation)
2. **Refund timing**: How long after scheduled date before auto-refund?
3. **Location precision**: How close is "nearby" for trust signals? (Using ~500m)
4. **Concurrent joins**: How to handle simultaneous joins? (Using transactions)

### Decisions Made:
- ✅ Linear price decay (simple, explainable)
- ✅ Subcollection for participants (efficient queries)
- ✅ Denormalized participant count (performance)
- ✅ Payment amount stored at join time (fairness)
- ✅ Fixed location pin (no radius matching)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Status**: Architecture Review

