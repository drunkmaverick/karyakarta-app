## App Store Review Notes (TestFlight)

### Test account (sample)
- Email: `reviewer+test@example.com`
- Password: `ReviewTest123!`

> Replace with a real internal tester account before submission.

### How to sign in
1) Launch the app.  
2) On the login screen, enter the test account credentials above and sign in.  
3) If testing signup, create a new account, then log out and back in with the new credentials.

### Core flows to exercise
- **Login/Signup**: Verify authentication works, session persists after relaunch.
- **Booking flow**: Create a new booking, review booking details, and ensure it appears in history.
- **Campaign history**: Open campaign lists/history and verify entries load.
- **Payouts**: Navigate to payouts and view payout history.
- **Push notification test**: Use the in-app notification test action (or `/api/push/test` endpoint) and confirm a notification is received.

### What to test (checklist)
- App launches without crashes; splash and home load.
- Authentication: login, logout, and session persistence.
- Creating a booking succeeds and shows in history.
- Campaign history loads and is scrollable.
- Payouts page loads existing payouts without errors.
- Push notification test delivers a notification to the device.
- App remains responsive when switching tabs/sections.
- No unexpected redirects to localhost; all content served from the bundled/hosted app.


