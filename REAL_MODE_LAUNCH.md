# KaryaKarta Real Mode Launch Guide

This guide covers the steps to deploy KaryaKarta with Razorpay payments in production mode.

## Environment Variables

### Required Environment Variables

Set these in your production environment (Vercel, Netlify, etc.):

```bash
# Mock Mode (set to 0 for production)
USE_MOCK=0

# Firebase Production
FIREBASE_PROJECT_ID=your-production-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_FCM_VAPID_KEY=your-vapid-key

# Razorpay Production Keys
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID_LIVE=rzp_live_xxx
RAZORPAY_KEY_SECRET_LIVE=rzp_live_secret_xxx
RAZORPAY_WEBHOOK_SECRET_LIVE=whsec_live_xxx
NEXT_PUBLIC_RAZORPAY_KEY_LIVE=rzp_live_xxx

# App Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.com
ADMIN_AUTH_SECRET=your-secure-admin-secret

# Optional: For test mode first
RAZORPAY_KEY_ID_TEST=rzp_test_xxx
RAZORPAY_KEY_SECRET_TEST=rzp_test_secret_xxx
RAZORPAY_WEBHOOK_SECRET_TEST=whsec_test_xxx
NEXT_PUBLIC_RAZORPAY_KEY_TEST=rzp_test_xxx
```

## Deployment Steps

### 1. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Verify deployment
firebase projects:list
```

### 2. Razorpay Account Setup

1. **Create Razorpay Account**
   - Go to [https://razorpay.com](https://razorpay.com)
   - Sign up for a business account

2. **Complete KYC Process**
   - Provide PAN number
   - Upload cancelled cheque or bank statement
   - Provide owner ID documents
   - Upload business proof documents
   - Provide GST certificate (if applicable)

3. **Add Bank Account**
   - Add your current account for settlements
   - Verify bank account details

4. **Get API Keys**
   - Go to Settings > API Keys
   - Copy your Live API Key ID and Secret
   - Generate webhook secret

### 3. Webhook Configuration

1. **Register Webhook URL**
   - Go to Razorpay Dashboard > Settings > Webhooks
   - Add webhook URL: `https://your-domain.com/api/transactions/webhook`
   - Select events: `payment.captured`, `payment.failed`, `order.paid`
   - Copy the webhook secret

2. **Test Webhook**
   - Use Razorpay's webhook testing feature
   - Send test webhook to verify endpoint works

### 4. Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Set Environment Variables**
   - Go to Vercel Dashboard > Project > Settings > Environment Variables
   - Add all required environment variables listed above

3. **Configure Custom Domain**
   - Add your custom domain in Vercel Dashboard
   - Update DNS records as instructed

### 5. Testing Commands

```bash
# Test with real Razorpay (test mode)
USE_MOCK=0 RAZORPAY_KEY_ID_TEST=rzp_test_xxx RAZORPAY_KEY_SECRET_TEST=rzp_test_secret_xxx ./scripts/real-mode-test.sh

# Test with live Razorpay (small amount)
USE_MOCK=0 RAZORPAY_KEY_ID_LIVE=rzp_live_xxx RAZORPAY_KEY_SECRET_LIVE=rzp_live_secret_xxx ./scripts/real-mode-test.sh
```

## Manual Actions Required

### 1. Razorpay Account & KYC
- ✅ Create Razorpay business account
- ✅ Complete KYC documentation
- ✅ Add bank account for settlements
- ✅ Get API keys and webhook secret

### 2. Domain & Hosting
- ✅ Deploy to Vercel/Netlify
- ✅ Set environment variables
- ✅ Configure custom domain
- ✅ Enable SSL certificate

### 3. Firebase Production Setup
- ✅ Create production Firebase project
- ✅ Upload service account JSON
- ✅ Set environment variables in hosting platform
- ✅ Deploy Firestore rules and indexes

### 4. Webhook Registration
- ✅ Register webhook URL in Razorpay dashboard
- ✅ Configure webhook events
- ✅ Test webhook endpoint
- ✅ Save webhook secret

### 5. Testing & Verification
- ✅ Run real-mode test script
- ✅ Test with small real payment (₹10)
- ✅ Verify webhook processing
- ✅ Test push notifications on real device

### 6. Monitoring & Compliance
- ✅ Set up error monitoring (Sentry)
- ✅ Configure logging and analytics
- ✅ Review privacy policy
- ✅ Ensure tax compliance (GST, etc.)

## Security Checklist

- [ ] All environment variables are set securely
- [ ] Firebase service account has minimal required permissions
- [ ] Razorpay webhook signature verification is enabled
- [ ] Admin authentication is properly configured
- [ ] HTTPS is enforced on all endpoints
- [ ] CORS is configured correctly
- [ ] Rate limiting is implemented
- [ ] Input validation is in place

## Monitoring Setup

### Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentry } = require('@sentry/nextjs');
module.exports = withSentry(nextConfig);
```

### Logging
- Use Vercel's built-in logging
- Set up Firebase Analytics
- Monitor Razorpay webhook logs
- Track payment success/failure rates

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check Razorpay dashboard for webhook logs

2. **Payment Failures**
   - Verify Razorpay API keys are correct
   - Check amount is in paise (multiply by 100)
   - Ensure currency is supported

3. **Firebase Connection Issues**
   - Verify service account credentials
   - Check Firestore rules allow access
   - Ensure project ID is correct

### Support Contacts

- Razorpay Support: [support@razorpay.com](mailto:support@razorpay.com)
- Firebase Support: [Firebase Console](https://console.firebase.google.com)
- Vercel Support: [Vercel Dashboard](https://vercel.com/dashboard)

## Post-Launch Checklist

- [ ] Monitor payment success rates
- [ ] Check webhook processing logs
- [ ] Verify push notifications work
- [ ] Test admin payout functionality
- [ ] Monitor error rates and performance
- [ ] Set up automated backups
- [ ] Configure monitoring alerts
- [ ] Document any custom configurations









