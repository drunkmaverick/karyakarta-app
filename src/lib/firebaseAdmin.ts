/**
 * Dev shim: reuse the emulator-aware admin helper.
 * In dev, this avoids requiring FIREBASE_CLIENT_EMAIL / PRIVATE_KEY.
 * In prod, the underlying helper still supports real creds.
 */
export { db, auth } from '../../app/lib/firebase-admin';
