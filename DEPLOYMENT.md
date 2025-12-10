# KaryaKarta v1 - Deployment Checklist

## 🚀 Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] All environment variables configured in production
- [ ] Firebase project properly set up
- [ ] Service account credentials uploaded
- [ ] VAPID keys generated and configured
- [ ] Admin password changed from default

### 2. Firebase Setup
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage bucket configured
- [ ] Cloud Messaging enabled
- [ ] Security rules deployed
- [ ] Authorized domains configured

### 3. Code Quality
- [ ] All linting errors resolved
- [ ] TypeScript compilation successful
- [ ] Service worker generated with correct environment variables
- [ ] All API endpoints tested
- [ ] Error handling implemented

### 4. Testing
- [ ] Admin login works
- [ ] Campaign CRUD operations work
- [ ] Push notifications work (with real FCM credentials)
- [ ] Customer booking flow works
- [ ] Provider job management works
- [ ] Payout system works

## 🔧 Deployment Steps

### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add all required environment variables
   - Ensure Firebase credentials are properly formatted

3. **Build Configuration**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install && npm run generate-sw`

### Firebase Hosting (Alternative)

1. **Build Project**
   ```bash
   npm run build
   npm run generate-sw
   ```

2. **Deploy to Firebase**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize hosting
   firebase init hosting
   
   # Deploy
   firebase deploy
   ```

## 🔍 Post-Deployment Verification

### 1. Basic Functionality
- [ ] Homepage loads correctly
- [ ] Admin login works
- [ ] Public campaign pages load
- [ ] Customer dashboard accessible
- [ ] Provider dashboard accessible

### 2. API Endpoints
- [ ] All API routes respond correctly
- [ ] Authentication works
- [ ] Database operations work
- [ ] File uploads work (if applicable)

### 3. Push Notifications
- [ ] Service worker loads
- [ ] Token registration works
- [ ] Notifications can be sent
- [ ] Background notifications work

### 4. Performance
- [ ] Page load times acceptable
- [ ] Images optimized
- [ ] API response times reasonable
- [ ] No console errors

## 🐛 Common Issues & Solutions

### Issue: Push Notifications Not Working
**Solution:**
- Check VAPID key configuration
- Verify service worker is accessible at `/firebase-messaging-sw.js`
- Ensure HTTPS is enabled in production
- Check browser console for errors

### Issue: Firebase Auth Errors
**Solution:**
- Verify API key configuration
- Check authorized domains in Firebase Console
- Ensure environment variables are set correctly
- Check for CORS issues

### Issue: Database Permission Errors
**Solution:**
- Review Firestore security rules
- Check service account permissions
- Verify database indexes are created
- Check for typos in collection names

### Issue: Build Failures
**Solution:**
- Check TypeScript compilation errors
- Verify all imports are correct
- Ensure environment variables are available during build
- Check for missing dependencies

## 📊 Monitoring & Maintenance

### 1. Error Tracking
- Set up error monitoring (Sentry, LogRocket, etc.)
- Monitor API response times
- Track user authentication failures
- Monitor push notification delivery rates

### 2. Performance Monitoring
- Use Vercel Analytics or similar
- Monitor Core Web Vitals
- Track API usage and costs
- Monitor database performance

### 3. Security Monitoring
- Regular security audits
- Monitor for suspicious activity
- Keep dependencies updated
- Review access logs

## 🔄 Updates & Maintenance

### 1. Regular Updates
- Keep dependencies updated
- Monitor for security patches
- Update Firebase SDK versions
- Review and update environment variables

### 2. Database Maintenance
- Regular backup of Firestore data
- Monitor database usage and costs
- Clean up old/unused data
- Optimize queries and indexes

### 3. Feature Updates
- Test new features in staging environment
- Use feature flags for gradual rollouts
- Monitor user feedback
- Plan for backward compatibility

## 📞 Support & Troubleshooting

### 1. Logs
- Check Vercel function logs
- Monitor Firebase console logs
- Review browser console errors
- Check network requests

### 2. Debug Mode
Enable debug mode by setting:
```bash
NEXT_PUBLIC_DEBUG=true
```

### 3. Common Commands
```bash
# Check build locally
npm run build

# Test APIs
npm run test:api

# Generate service worker
npm run generate-sw

# Start development server
npm run dev
```

## ✅ Final Checklist

- [ ] All features working in production
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team trained on deployment process
- [ ] Backup procedures in place
- [ ] Rollback plan ready

---

**Deployment Status:** ✅ Ready for Production
**Last Updated:** $(date)
**Version:** v1.0.0

