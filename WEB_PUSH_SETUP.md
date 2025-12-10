# Web Push Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) for web push notifications in the KaryaKarta app.

## Environment Variables

Add these to your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id
NEXT_PUBLIC_FCM_VAPID_KEY=your_public_vapid_key_from_console

# Server Configuration
USE_MOCK=0
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Cloud Messaging
4. Generate a new Web Push certificate (VAPID key pair)
5. Copy the public key to `NEXT_PUBLIC_FCM_VAPID_KEY`

## Service Worker

The service worker is located at `/public/firebase-messaging-sw.js` and handles:
- Background message reception
- Notification display
- Click actions

## Testing

1. Start the development server: `npm run dev`
2. Visit `/dashboard/customer`
3. Click "Enable Notifications" and allow in browser
4. Check browser console for FCM token
5. Verify token is stored in Firestore `pushTokens` collection
6. Test notifications from Admin > Campaigns > Send test push

## Files Created/Modified

- `public/firebase-messaging-sw.js` - Service worker for push notifications
- `src/utils/pushClient.ts` - Client-side push notification utilities
- `app/api/push/unregister-token/route.ts` - API to unregister tokens
- `app/dashboard/customer/page.tsx` - Customer dashboard with notification controls
- `app/admin/campaigns/CampaignsPage.tsx` - Admin campaigns with test push button

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Limited support (iOS Safari has restrictions)
- Mobile browsers: Varies by platform

## Troubleshooting

1. **Service Worker not registering**: Check browser console for errors
2. **Token not generated**: Verify VAPID key is correct
3. **Notifications not received**: Check browser notification permissions
4. **FCM errors**: Verify Firebase project configuration and credentials
















