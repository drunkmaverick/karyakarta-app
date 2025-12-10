# KaryaKarta v1 - Complete Implementation

A comprehensive cleaning service platform with admin dashboard, customer app, provider app, community campaigns, and push notifications.

## 🚀 Features Implemented

## 🔧 Environment Setup

### Mock Mode (Development)
```bash
# Use mock mode for development
USE_MOCK=1 npm run dev
```

### Real Mode (Production)
1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your Firebase credentials in `.env.local`:
```bash
# Mode
USE_MOCK=0

# Firebase Admin (server) - Get from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Firebase Web (client) - Get from Firebase Console > Project Settings > General
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id
NEXT_PUBLIC_FCM_VAPID_KEY=your_web_push_vapid_key
```

3. Deploy Firestore rules and indexes:
```bash
# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

4. Start the app:
```bash
USE_MOCK=0 npm run dev
```

### Getting Firebase Credentials

#### Firebase Admin SDK (Server-side)
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract `project_id`, `client_email`, and `private_key` from the JSON

#### Firebase Web Config (Client-side)
1. Go to Firebase Console > Project Settings > General
2. Scroll down to "Your apps" section
3. Click the web app icon (</>) or add a new web app
4. Copy the config values from the Firebase SDK snippet

#### FCM VAPID Key (Web Push)
1. Go to Firebase Console > Project Settings > Cloud Messaging
2. Scroll down to "Web configuration"
3. Generate a new key pair if needed
4. Copy the "Key pair" value

## 🧪 Testing

### Smoke Tests
Run the complete test suite:
```bash
./scripts/smoke.sh
```

### Manual Testing
1. **Health Check**: `curl http://localhost:3000/api/health`
2. **Admin Login**: Use the smoke test script or admin UI
3. **Campaign CRUD**: Test through admin dashboard
4. **Push Notifications**: Test through customer dashboard

### Troubleshooting

#### Common Issues
- **"Firebase not initialized"**: Check your environment variables
- **"FCM not configured"**: Verify VAPID key and messaging sender ID
- **"Permission denied"**: Check Firestore rules deployment
- **"Invalid token"**: Tokens are automatically cleaned up on failure

#### Debug Mode
Set `NODE_ENV=development` for detailed logging:
```bash
NODE_ENV=development USE_MOCK=0 npm run dev
```

## 🚀 Features Implemented

## 👥 Customer/Provider Flows

### Customer Flow
The customer flow allows users to book services, track their history, and rate completed jobs.

#### Customer APIs
- **POST** `/api/jobs/create` - Create a new service booking
- **GET** `/api/jobs/by-customer` - List customer's job history with pagination
- **POST** `/api/jobs/rate` - Rate a completed job (1-5 stars with optional comment)
- **POST** `/api/jobs/repeat` - Create a new booking based on a previous job

#### Customer UI Pages
- **`/dashboard/customer`** - Customer dashboard with quick actions
- **`/bookings/new`** - Service booking form with date/time selection
- **`/history/customer`** - Job history with rating and repeat functionality

#### Customer Features
- Service type selection (deep clean, regular clean, plumbing, etc.)
- Date/time scheduling with validation
- Address and notes input
- Price estimation
- Job status tracking
- Rating system for completed jobs
- One-click job repeat
- Push notification integration

### Provider Flow
The provider flow allows service providers to manage their assigned jobs and track earnings.

#### Provider APIs
- **GET** `/api/provider/jobs` - List provider's assigned jobs (with optional status filter)
- **POST** `/api/provider/jobs/update-status` - Update job status (accepted → in_progress → completed)
- **GET** `/api/provider/payouts` - List provider's payouts with pagination

#### Provider UI Pages
- **`/dashboard/provider`** - Provider dashboard with job management
- **`/history/provider`** - Complete job history with earnings
- **`/payouts/provider`** - Payout tracking and status

#### Provider Features
- Job assignment and status management
- Status transition validation (pending → accepted → in_progress → completed)
- Automatic payout draft creation on job completion
- Earnings tracking and statistics
- Performance metrics display
- Job history with customer ratings

### Data Model
The system uses a comprehensive Firestore data model with proper indexing and security rules.

#### Collections
- **`customers/{customerId}`** - Customer profiles and information
- **`providers/{providerId}`** - Provider profiles with ratings and skills
- **`jobs/{jobId}`** - Service jobs with status tracking and ratings
- **`payouts/{payoutId}`** - Provider payouts with status tracking

#### Security Rules
- Customers can only access their own data and jobs
- Providers can only access their assigned jobs and payouts
- Admin has full access to all collections
- Proper validation for status transitions and rating permissions

### API Usage Examples

#### Customer: Create Job
```bash
curl -X POST http://localhost:3000/api/jobs/create \
  -H "Authorization: Bearer <CUSTOMER_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "deep_clean",
    "scheduledForISO": "2025-10-01T10:00:00.000Z",
    "address": "123 Main St, Mumbai",
    "notes": "Please clean the kitchen thoroughly",
    "price": 800
  }'
```

#### Customer: List Jobs
```bash
curl -H "Authorization: Bearer <CUSTOMER_ID_TOKEN>" \
  "http://localhost:3000/api/jobs/by-customer?limit=20"
```

#### Customer: Rate Job
```bash
curl -X POST http://localhost:3000/api/jobs/rate \
  -H "Authorization: Bearer <CUSTOMER_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job_123",
    "score": 5,
    "comment": "Excellent service!"
  }'
```

#### Provider: List Jobs
```bash
curl -H "Authorization: Bearer <PROVIDER_ID_TOKEN>" \
  "http://localhost:3000/api/provider/jobs?status=pending"
```

#### Provider: Update Job Status
```bash
curl -X POST http://localhost:3000/api/provider/jobs/update-status \
  -H "Authorization: Bearer <PROVIDER_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job_123",
    "to": "accepted"
  }'
```

#### Provider: List Payouts
```bash
curl -H "Authorization: Bearer <PROVIDER_ID_TOKEN>" \
  "http://localhost:3000/api/provider/payouts?limit=20"
```

### Testing
The complete customer and provider flows are tested via the smoke test script:

```bash
./scripts/smoke.sh
```

This tests:
- Customer job creation and listing
- Provider job management and status updates
- Payout tracking and management
- All API endpoints with proper authentication

### ✅ Phase 1: Push Notifications Infrastructure
- Firebase Cloud Messaging (FCM) web push notifications
- Service worker for background notifications
- Token registration and management
- Location-based notification targeting
- Emulator-compatible with graceful fallbacks

#### 📱 iOS Safari Limitations & Testing
**Important**: iOS Safari has significant limitations for web push notifications:

- **iOS 16.4+ Required**: Web push notifications only work on iOS 16.4 and later
- **Add to Home Screen**: Users must add the PWA to home screen for notifications to work
- **No Background Notifications**: Notifications only work when app is in foreground or recently used
- **Limited Service Worker**: Background sync and push events are restricted

**Recommended Test Devices**:
- **Desktop**: Chrome, Firefox, Edge (full functionality)
- **Android**: Chrome, Samsung Internet (full functionality)
- **iOS**: Safari 16.4+ with PWA installation (limited functionality)
- **Fallback**: Use mock mode for iOS testing (`USE_MOCK=1`)

**Testing Strategy**:
1. Test full functionality on desktop/Android
2. Use mock mode for iOS development
3. Test PWA installation on iOS for production validation

### ✅ Phase 2: Campaigns (Local Area Listings)
- Admin CRUD for cleaning campaigns
- Public campaign listing and detail pages
- Before/after photo overlay toggle
- Geographic targeting with radius-based notifications
- Campaign signup tracking

### ✅ Phase 3: Customer App
- Customer dashboard with quick actions
- Service booking with date/time selection
- Service history with rating system
- One-click job repeat functionality
- Push notification and location services

### ✅ Phase 4: Provider App
- Provider dashboard with job management
- Job status updates (Accept → In Progress → Complete)
- Automatic payout draft creation on completion
- Performance statistics and earnings tracking
- Job history and rating display

### ✅ Phase 5: Admin Polish
- Enhanced jobs management with provider assignment
- Payout linking and status tracking
- Provider management integration
- Bulk operations and CSV export
- Real-time status updates

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Storage**: Firebase Storage (for campaign images)
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
app/
├── admin/                    # Admin dashboard
│   ├── analytics/           # Analytics page
│   ├── campaigns/           # Campaign management
│   ├── customers/           # Customer management
│   ├── jobs/               # Job management
│   ├── payouts/            # Payout management
│   └── settings/           # Admin settings
├── api/                     # API endpoints
│   ├── campaigns/          # Campaign CRUD APIs
│   ├── customers/          # Customer APIs
│   ├── jobs/               # Job management APIs
│   ├── payouts/            # Payout APIs
│   ├── providers/          # Provider APIs
│   └── push/               # Push notification APIs
├── bookings/               # Customer booking pages
├── campaigns/              # Public campaign pages
├── dashboard/              # User dashboards
│   ├── customer/           # Customer dashboard
│   └── provider/           # Provider dashboard
├── history/                # Service history pages
└── payouts/                # Payout pages

components/                  # Reusable components
src/
├── lib/                    # Utility libraries
│   ├── firebaseClient.ts   # Firebase client config
│   └── geo.ts             # Geolocation utilities
└── hooks/                  # Custom React hooks

public/
├── firebase-messaging-sw.js # Service worker
└── icons/                  # App icons
```

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY=your-vapid-key

# Admin
ADMIN_PASSWORD=admin123
```

### Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication, Firestore, Storage, and Cloud Messaging

2. **Configure Authentication**:
   - Enable Email/Password authentication
   - Add your domain to authorized domains

3. **Set up Firestore**:
   - Create Firestore database
   - Set up security rules (see `firestore.rules`)

4. **Configure Cloud Messaging**:
   - Generate VAPID key pair
   - Add web push certificate

5. **Download Service Account**:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Save as `serviceAccount.json` in project root

## 🚀 Installation & Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase CLI (optional, for emulator)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd karyakarta-v1

# Install dependencies
npm install

# Generate service worker with environment variables
npm run generate-sw

# Start development server
npm run dev
```

### Firebase Emulator (Optional)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Start emulators
firebase emulators:start

# The app will use emulators when running locally
```

## 📖 Runbook: Push + Campaigns

### Environment Variables

#### Client-Side (NEXT_PUBLIC_*)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FCM_VAPID_KEY=your_vapid_key
```

#### Server-Side
```bash
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
USE_MOCK=0  # Set to 1 for mock mode
ADMIN_PASSWORD=admin123
```

### Mock vs Real Modes

#### Mock Mode (`USE_MOCK=1`)
- All Firebase operations simulated
- Push notifications return mock responses
- No real FCM tokens required
- Perfect for development and testing

#### Real Mode (`USE_MOCK=0`)
- Full Firebase integration
- Real FCM push notifications
- Requires valid service account credentials
- Production-ready functionality

### Testing Steps

#### Customer Dashboard Testing
1. **Enable Push Notifications**:
   ```bash
   # Visit /dashboard/customer
   # Click "Enable notifications"
   # Grant browser permission
   # Verify status shows "Push: On • {env}"
   ```

2. **Test Notification**:
   ```bash
   # Click "Test notification" button
   # Verify success message appears
   # Check browser notifications (if supported)
   ```

3. **Location Services**:
   ```bash
   # Click "Update location" button
   # Grant location permission
   # Verify coordinates are captured
   ```

#### Admin Campaign Testing
1. **Dry Run Test**:
   ```bash
   curl -s -b cookies.txt -X POST http://localhost:3000/api/push/notify-campaign \
     -H "Content-Type: application/json" \
     -d '{"campaignId":"test-campaign-1","center":{"lat":19.117,"lng":72.905},"radiusMeters":2000,"dryRun":true}'
   ```

2. **Send Notifications**:
   ```bash
   curl -s -b cookies.txt -X POST http://localhost:3000/api/push/notify-campaign \
     -H "Content-Type: application/json" \
     -d '{"campaignId":"test-campaign-1","center":{"lat":19.117,"lng":72.905},"radiusMeters":2000}'
   ```

3. **Test Cooldown**:
   ```bash
   # Try sending again immediately
   # Should get cooldown error message
   # Wait 30 seconds and try again
   ```

### Common Pitfalls

#### Service Worker Issues
- **Problem**: Service worker not registering
- **Solution**: Check `/firebase-messaging-sw.js` exists and is accessible
- **Debug**: Check browser console for service worker errors

#### VAPID Key Issues
- **Problem**: Push notifications fail with VAPID errors
- **Solution**: Ensure `NEXT_PUBLIC_FCM_VAPID_KEY` is correctly set
- **Debug**: Check FCM console for key configuration

#### Blocked Notifications
- **Problem**: Browser blocks notification permission
- **Solution**: Must be on HTTPS (or localhost), user must grant permission
- **Debug**: Check browser notification settings

#### iOS Safari Limitations
- **Problem**: Notifications don't work on iOS Safari
- **Solution**: Use PWA mode (Add to Home Screen) or mock mode for testing
- **Debug**: Check iOS version (16.4+ required)

## 🧪 Testing

### Manual Testing Checklist

#### 1. Push Notifications
```bash
# Test token registration
curl -X POST http://localhost:3000/api/push/register-token \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'

# Test campaign notifications (admin)
curl -X POST http://localhost:3000/api/push/notify-campaign \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"<CAMPAIGN_ID>"}'
```

#### 2. Campaigns
```bash
# Create campaign (admin)
curl -X POST http://localhost:3000/api/campaigns/create \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Campaign",
    "description":"Test description",
    "area":{"lat":19.1197,"lng":72.8468,"radiusM":2000},
    "pricePerPerson":199,
    "currency":"INR",
    "window":{"start":"2025-09-20T06:00:00Z","end":"2025-09-20T09:00:00Z"},
    "status":"active"
  }'

# List campaigns (public)
curl http://localhost:3000/api/campaigns/list
```

#### 3. Customer Flow
```bash
# Update location
curl -X POST http://localhost:3000/api/customers/update-location \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"lat":19.12,"lng":72.85}'

# Create job
curl -X POST http://localhost:3000/api/jobs/create \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "service":"deep_cleaning",
    "scheduledAt":"2025-09-22T07:00:00Z",
    "address":"Test Address",
    "notes":"Test notes"
  }'

# Repeat job
curl -X POST http://localhost:3000/api/jobs/repeat \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"<JOB_ID>","scheduledAt":"2025-09-23T07:00:00Z"}'
```

#### 4. Provider Flow
```bash
# Update job status
curl -X POST http://localhost:3000/api/providers/jobs/update-status \
  -H "Authorization: Bearer <PROVIDER_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"<JOB_ID>","to":"in_progress"}'

# Get provider stats
curl -H "Authorization: Bearer <PROVIDER_ID_TOKEN>" \
  http://localhost:3000/api/providers/stats
```

### UI Testing

1. **Admin Dashboard** (`/admin`)
   - Login with admin credentials
   - Test all CRUD operations
   - Verify provider assignment
   - Check payout linking

2. **Customer App** (`/dashboard/customer`)
   - Enable notifications
   - Update location
   - Book services
   - View history and rate jobs

3. **Provider App** (`/dashboard/provider`)
   - Accept and complete jobs
   - View earnings and payouts
   - Check performance stats

4. **Public Campaigns** (`/campaigns`)
   - Browse active campaigns
   - Test overlay toggle
   - Sign up for campaigns

## 📊 Data Models

### Firestore Collections

#### customers
```typescript
{
  name: string;
  phone?: string;
  email: string;
  area?: string;
  active: boolean;
  notes?: string;
  lastKnownLocation?: {
    lat: number;
    lng: number;
    updatedAt: Timestamp;
  };
  fcmTokens?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### providers
```typescript
{
  name: string;
  phone?: string;
  area?: string;
  active: boolean;
  ratingAvg: number;
  ratingCount: number;
  skills?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### jobs
```typescript
{
  customerId: string;
  providerId?: string;
  service: string;
  scheduledAt: Timestamp;
  status: 'created' | 'pending' | 'in_progress' | 'completed' | 'canceled' | 'failed';
  amount: number;
  currency: 'INR';
  notes?: string;
  address?: string;
  location?: { lat: number; lng: number };
  repeatOfJobId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### campaigns
```typescript
{
  name: string;
  description: string;
  area: {
    lat: number;
    lng: number;
    radiusM: number;
  };
  pricePerPerson: number;
  currency: 'INR';
  window: {
    start: Timestamp;
    end: Timestamp;
  };
  heroImageUrls: string[];
  status: 'draft' | 'active' | 'closed';
  signups: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### payouts
```typescript
{
  jobId: string;
  providerId: string;
  amount: number;
  currency: 'INR';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🔒 Security

- Admin routes protected with `requireAdmin` middleware
- Customer/Provider APIs use Firebase ID token verification
- Firestore security rules enforce data access controls
- Environment variables properly configured
- CORS and rate limiting considerations

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**:
   - Connect your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard

2. **Build Configuration**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install && npm run generate-sw"
   }
   ```

3. **Environment Variables**:
   - Add all required environment variables
   - Ensure Firebase credentials are properly configured

### Firebase Hosting (Alternative)

```bash
# Build the project
npm run build

# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase hosting
firebase init hosting

# Deploy
firebase deploy
```

## 🐛 Troubleshooting

### Common Issues

1. **Push Notifications Not Working**:
   - Check VAPID key configuration
   - Verify service worker is properly generated
   - Ensure HTTPS in production

2. **Firebase Auth Issues**:
   - Check authorized domains
   - Verify API key configuration
   - Check browser console for errors

3. **Emulator Issues**:
   - Ensure Firebase CLI is installed
   - Check emulator ports are available
   - Verify `firebase.json` configuration

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG=true
```

## 📈 Performance Considerations

- Lazy loading for large datasets
- Pagination for job listings
- Image optimization for campaign photos
- Caching strategies for API responses
- Service worker for offline functionality

## 🔄 Future Enhancements

- Real-time chat between customers and providers
- Advanced analytics and reporting
- Mobile app development
- AI-powered job matching
- Payment gateway integration
- Multi-language support

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

For internal development only. Please follow the established coding standards and testing procedures.

---

**KaryaKarta v1** - Complete implementation with all requested features ✅

