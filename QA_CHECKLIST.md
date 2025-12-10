# QA Checklist - KaryaKarta Customer/Provider Flows

This checklist covers manual testing steps for the complete customer and provider flows.

## Pre-Test Setup

### 1. Environment Setup
- [ ] Start the development server: `USE_MOCK=1 npm run dev`
- [ ] Verify health endpoint: `curl http://localhost:3000/api/health`
- [ ] Confirm mock mode is active in response

### 2. Browser Setup
- [ ] Open browser developer tools
- [ ] Enable location services for testing
- [ ] Enable push notifications for testing
- [ ] Clear browser cache and local storage

## Customer Flow Testing

### 3. Customer Authentication & Dashboard
- [ ] Navigate to `/login`
- [ ] Sign in as a customer (or use mock authentication)
- [ ] Verify redirect to `/dashboard/customer`
- [ ] Check that dashboard loads without errors
- [ ] Verify "Quick Actions" section is visible
- [ ] Test responsive design on mobile (≤360px width)
- [ ] Verify notification status pill shows "ON (mock)" or "OFF (real)"

### 4. New Booking Creation
- [ ] Click "New Booking" from dashboard
- [ ] Navigate to `/bookings/new`
- [ ] Fill out the booking form:
  - [ ] Select service type (e.g., "Deep Cleaning")
  - [ ] Set scheduled date/time
  - [ ] Enter address
  - [ ] Add optional notes
  - [ ] Set price
- [ ] Submit the form
- [ ] Verify success message appears
- [ ] Verify redirect to history page
- [ ] Check that new job appears in history

### 5. Customer History & Rating
- [ ] Navigate to `/history/customer`
- [ ] Verify job history loads (should show the job created above)
- [ ] Check job details are displayed correctly:
  - [ ] Service type
  - [ ] Scheduled time
  - [ ] Address
  - [ ] Price
  - [ ] Status (should be "pending")
- [ ] Test "Repeat Job" functionality:
  - [ ] Click "Repeat Job" button
  - [ ] Confirm dialog appears
  - [ ] Verify new job is created
- [ ] Test rating functionality (if job is completed):
  - [ ] Click "Rate Service" button
  - [ ] Select rating (1-5 stars)
  - [ ] Add optional comment
  - [ ] Submit rating
  - [ ] Verify rating appears in job details

### 6. Mobile Responsiveness (Customer)
- [ ] Test on mobile viewport (≤360px width)
- [ ] Verify cards stack properly
- [ ] Check table scrolls horizontally on mobile
- [ ] Verify buttons are touch-friendly
- [ ] Test skeleton loading states

## Provider Flow Testing

### 7. Provider Authentication & Dashboard
- [ ] Sign in as a provider (or use mock authentication)
- [ ] Navigate to `/dashboard/provider`
- [ ] Verify dashboard loads without errors
- [ ] Check earnings summary is displayed
- [ ] Verify "My Jobs" table is visible
- [ ] Test responsive design on mobile

### 8. Provider Job Management
- [ ] View assigned jobs in the table
- [ ] Test job status updates:
  - [ ] Click "Accept" for pending jobs
  - [ ] Click "Start" for accepted jobs
  - [ ] Click "Complete" for in-progress jobs
- [ ] Verify status changes are reflected in the UI
- [ ] Check that completed jobs create payouts

### 9. Provider History
- [ ] Navigate to `/history/provider`
- [ ] Verify completed jobs are listed
- [ ] Check job details include:
  - [ ] Service type and price
  - [ ] Completion date
  - [ ] Customer rating (if available)
  - [ ] Payout information
- [ ] Test pagination if many jobs exist

### 10. Provider Payouts
- [ ] Navigate to `/payouts/provider`
- [ ] Verify payouts are listed
- [ ] Check payout details:
  - [ ] Amount
  - [ ] Status (draft, queued, completed, failed)
  - [ ] Job ID link
  - [ ] Creation date
- [ ] Verify total earnings calculation

### 11. Mobile Responsiveness (Provider)
- [ ] Test provider dashboard on mobile
- [ ] Verify stats cards stack properly
- [ ] Check table scrolls horizontally
- [ ] Test action buttons are accessible
- [ ] Verify skeleton loading states

## API Testing

### 12. Customer API Endpoints
- [ ] Test job creation: `POST /api/jobs/create`
- [ ] Test job listing: `GET /api/jobs/by-customer`
- [ ] Test job rating: `POST /api/jobs/rate`
- [ ] Test job repeat: `POST /api/jobs/repeat`
- [ ] Verify all endpoints return proper JSON responses
- [ ] Check error handling for invalid requests

### 13. Provider API Endpoints
- [ ] Test job listing: `GET /api/provider/jobs`
- [ ] Test status update: `POST /api/provider/jobs/update-status`
- [ ] Test payouts: `GET /api/provider/payouts`
- [ ] Verify proper authentication required
- [ ] Check status transition validation

### 14. Health Endpoint
- [ ] Test health endpoint: `GET /api/health`
- [ ] Verify mock mode response
- [ ] Test with `USE_MOCK=0` (if Firebase is configured)
- [ ] Check error handling for missing credentials

## Push Notifications Testing

### 15. Notification Setup
- [ ] Enable push notifications in browser
- [ ] Register push token via API
- [ ] Verify token registration success
- [ ] Test notification permission handling

### 16. Notification Actions
- [ ] Test "Send Test Notification" button
- [ ] Test "Notify nearby (test)" button
- [ ] Verify notification status pill updates
- [ ] Check notification content and formatting

## Admin Integration Testing

### 17. Admin Job Management
- [ ] Sign in as admin
- [ ] Navigate to `/admin/jobs`
- [ ] Verify jobs are listed with provider links
- [ ] Check payout information is displayed
- [ ] Test provider profile links
- [ ] Test payout detail links

## Error Handling Testing

### 18. Network Errors
- [ ] Test with network disconnected
- [ ] Verify proper error messages
- [ ] Check loading states during errors
- [ ] Test retry mechanisms

### 19. Authentication Errors
- [ ] Test with expired tokens
- [ ] Test with invalid tokens
- [ ] Verify proper redirect to login
- [ ] Check error message display

### 20. Data Validation
- [ ] Test form validation
- [ ] Test required field handling
- [ ] Test invalid data submission
- [ ] Verify proper error messages

## Performance Testing

### 21. Loading Performance
- [ ] Test initial page load times
- [ ] Check API response times
- [ ] Verify skeleton loading states
- [ ] Test pagination performance

### 22. Mobile Performance
- [ ] Test on slow mobile connection
- [ ] Verify touch interactions
- [ ] Check scroll performance
- [ ] Test form submission on mobile

## Security Testing

### 23. Data Isolation
- [ ] Verify customers can only see their own jobs
- [ ] Verify providers can only see their assigned jobs
- [ ] Test cross-user data access prevention
- [ ] Check admin access controls

### 24. Input Validation
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Verify input sanitization
- [ ] Check file upload security

## Final Verification

### 25. End-to-End Flow
- [ ] Complete customer booking flow
- [ ] Complete provider job management flow
- [ ] Verify data consistency across all pages
- [ ] Test all navigation links
- [ ] Verify all forms work correctly

### 26. Cross-Browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile browsers

### 27. Documentation Verification
- [ ] Verify README.md is updated
- [ ] Check rules-readme.md is accurate
- [ ] Verify API documentation
- [ ] Check deployment instructions

## Sign-off

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Security requirements met
- [ ] Ready for production deployment

**Tester:** _________________  
**Date:** _________________  
**Version:** _________________