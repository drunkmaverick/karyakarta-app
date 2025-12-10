# Real Mode Testing Guide

This guide covers testing the KaryaKarta application in real mode (production-like environment) with actual Firebase services.

## Prerequisites

### 1. Firebase Project Setup
- Create a Firebase project at https://console.firebase.google.com
- Enable Firestore Database
- Enable Cloud Messaging (FCM)
- Generate a service account key

### 2. Environment Variables
Set the following environment variables:

```bash
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
export FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
```

### 3. Firestore Security Rules
Deploy the security rules to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

### 4. Firestore Indexes
Deploy the composite indexes:

```bash
firebase deploy --only firestore:indexes
```

## Testing Steps

### 1. Health Check
Test the health endpoint to verify Firebase connectivity:

```bash
curl http://localhost:3000/api/health
```

Expected response in real mode:
```json
{
  "ok": true,
  "useMock": false,
  "projectId": "your-project-id",
  "hasMessaging": true,
  "firebase": {
    "projectId": "your-project-id",
    "messagingAvailable": true,
    "firestoreAvailable": true
  }
}
```

### 2. Self Check
Test Firestore connectivity and indexes:

```bash
curl http://localhost:3000/api/self-check
```

Expected response:
```json
{
  "ok": true,
  "useMock": false,
  "samples": {
    "campaigns": [...],
    "jobs": [...],
    "pushTokens": [...]
  },
  "counts": {
    "campaigns": 0,
    "jobs": 0,
    "pushTokens": 0
  }
}
```

### 3. Automated Real Mode Test
Run the automated test script:

```bash
./scripts/real-mode-test.sh
```

This script will:
- Start the server in real mode
- Test all API endpoints
- Verify Firebase connectivity
- Test push notifications
- Clean up and stop the server

### 4. Manual Testing with Postman
Use the provided Postman collection:

1. Import `docs/api-tests/karyakarta-api-tests.http`
2. Update the `@baseUrl` variable
3. Run the collection tests

### 5. Mobile Device Testing

#### Enable Notifications
1. Open the app on a real device
2. Navigate to the customer dashboard
3. Click "Enable Notifications"
4. Allow notifications when prompted
5. Verify the notification status pill shows "ON (real)"

#### Test Push Notifications
1. Create a campaign with small radius (250m)
2. Update your location to be within the radius
3. Send a dry-run notification first
4. Send a live notification
5. Verify the notification appears on the device

#### Complete Job Flow
1. Create a job as a customer
2. Accept the job as a provider
3. Update job status to "in_progress"
4. Complete the job
5. Rate the job as a customer
6. Verify payout is created
7. Check payout details as provider

## Troubleshooting

### Firebase Connection Issues

If the health check fails:

1. **Check Environment Variables**:
   ```bash
   echo $FIREBASE_PROJECT_ID
   echo $FIREBASE_CLIENT_EMAIL
   ```

2. **Verify Service Account Key**:
   - Ensure the private key is properly formatted with `\n` for newlines
   - Check that the service account has the necessary permissions

3. **Check Firestore Rules**:
   - Ensure rules are deployed and allow the operations
   - Test with Firebase Console

4. **Check FCM Configuration**:
   - Verify FCM is enabled in Firebase Console
   - Check that the service account has FCM permissions

### Common Issues

#### "Firebase Admin DB not initialized"
- Check `FIREBASE_PROJECT_ID` is set
- Verify service account credentials

#### "FCM initialization failed"
- Check `firebase-admin` package is installed
- Verify FCM is enabled in Firebase Console

#### "Permission denied" errors
- Check Firestore security rules
- Verify service account has necessary permissions

#### Push notifications not working
- Check device notification permissions
- Verify FCM server key is configured
- Test with Firebase Console first

## Expected Results

### Successful Real Mode Test
- All API endpoints return proper responses
- Firebase services are available
- Push notifications work on real devices
- Jobs can be created and managed
- Payouts are generated correctly
- All data is persisted in Firestore

### Performance Expectations
- API responses should be < 2 seconds
- Push notifications should arrive within 30 seconds
- Database operations should complete successfully
- No memory leaks or crashes

## Security Verification

### Data Isolation
- Customers can only see their own jobs
- Providers can only see assigned jobs
- Admin has full access
- No cross-user data leakage

### Authentication
- All endpoints require proper authentication
- Tokens are validated correctly
- Unauthorized access is blocked

### Input Validation
- All inputs are validated
- SQL injection attempts are blocked
- XSS attempts are sanitized

## Production Readiness Checklist

- [ ] Firebase project configured
- [ ] Environment variables set
- [ ] Security rules deployed
- [ ] Indexes deployed
- [ ] Health check passes
- [ ] Self-check passes
- [ ] All API endpoints work
- [ ] Push notifications work
- [ ] Mobile testing completed
- [ ] Performance is acceptable
- [ ] Security verified
- [ ] Error handling works
- [ ] Logging is configured
- [ ] Monitoring is set up

## Support

If you encounter issues:

1. Check the logs for error messages
2. Verify Firebase Console for data
3. Test individual endpoints with curl
4. Check browser developer tools
5. Review the troubleshooting section above

For additional help, refer to:
- Firebase Documentation
- Next.js API Routes Documentation
- Firestore Security Rules Guide













