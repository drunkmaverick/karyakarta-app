# Firestore Security Rules Documentation

This document explains the Firestore security rules and which API routes read/write which collections.

## Collections and Access Patterns

### 1. `customers` Collection
**Purpose**: Store customer profile information

**Rules**:
- `read`: Signed-in customer can read their own data (`request.auth.uid == customerId`)
- `write`: Admin only (`request.auth.token.admin == true`)

**API Routes that access this collection**:
- `POST /api/jobs/create` - Creates a default customer document if one doesn't exist
- Admin routes - Full CRUD access

### 2. `providers` Collection
**Purpose**: Store provider profile information and ratings

**Rules**:
- `read`: Signed-in provider can read their own data (`request.auth.uid == providerId`)
- `write`: Admin only (`request.auth.token.admin == true`)

**API Routes that access this collection**:
- `POST /api/jobs/rate` - Updates provider rating aggregates when a job is rated
- Admin routes - Full CRUD access

### 3. `jobs` Collection
**Purpose**: Store job/service booking information

**Rules**:
- `read`: Customer can read their own jobs OR provider can read assigned jobs
- `create`: Customer can create jobs for themselves
- `update`: 
  - Customer can add ratings to completed jobs they own
  - Provider can update status transitions on jobs assigned to them
- `write`: Admin only (full access)

**API Routes that access this collection**:
- `POST /api/jobs/create` - Creates new jobs
- `GET /api/jobs/by-customer` - Lists customer's jobs
- `POST /api/jobs/rate` - Updates job with rating
- `POST /api/jobs/repeat` - Creates new job from existing one
- `GET /api/provider/jobs` - Lists provider's assigned jobs
- `POST /api/provider/jobs/update-status` - Updates job status
- Admin routes - Full CRUD access

### 4. `payouts` Collection
**Purpose**: Store provider payout information

**Rules**:
- `read`: Provider can read their own payouts (`request.auth.uid == providerId`)
- `write`: Admin only (`request.auth.token.admin == true`)

**API Routes that access this collection**:
- `POST /api/provider/jobs/update-status` - Creates payout when job is completed
- `GET /api/provider/payouts` - Lists provider's payouts
- Admin routes - Full CRUD access

### 5. `pushTokens` Collection
**Purpose**: Store FCM push notification tokens

**Rules**:
- `create, update, delete`: User can manage their own tokens
- `read`: Admin only

**API Routes that access this collection**:
- `POST /api/push/register-token` - Registers user's push token
- `POST /api/push/unregister-token` - Removes user's push token
- Admin routes - Read access

### 6. `analytics` Collection
**Purpose**: Store analytics data

**Rules**:
- `read`: Public read access
- `write`: Admin only

### 7. `campaigns` Collection
**Purpose**: Store push notification campaigns

**Rules**:
- `read`: Public read access
- `write`: Admin only

**API Routes that access this collection**:
- Campaign management routes - Admin only

## Security Principles

1. **Data Isolation**: Users can only access their own data
2. **Role-Based Access**: Admin has full access, regular users have limited access
3. **Status Transitions**: Job status updates follow defined business rules
4. **Atomic Operations**: Rating updates use transactions to maintain data consistency
5. **Default Deny**: Any collection not explicitly allowed is denied by default

## Helper Functions

### `isStatusTransition(from, to)`
Validates legal job status transitions:
- `pending` → `accepted` or `canceled`
- `accepted` → `in_progress` or `canceled`
- `in_progress` → `completed` or `canceled`
- `completed` → (no further transitions)
- `canceled` → (no further transitions)
- `failed` → (no further transitions)

This ensures jobs follow a logical progression and prevents invalid state changes.













