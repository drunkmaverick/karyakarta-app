import { getApps, initializeApp, getApp, AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function main() {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'karyakarta-app';

  const opts: AppOptions = { projectId: process.env.FIREBASE_PROJECT_ID };
  const app = getApps().length ? getApp() : initializeApp(opts);
  const db = getFirestore(app);

  const col = db.collection('payouts');
  const snap = await col.limit(1).get();
  if (!snap.empty) {
    console.log('payouts already seeded. count>=1');
    return;
  }

  const batch = db.batch();
  for (let i = 0; i < 5; i++) {
    const ref = col.doc();
    batch.set(ref, {
      createdAt: new Date().toISOString(),
      amount: 100,
      status: 'queued',
    });
  }
  await batch.commit();
  console.log('Seeded payouts with 5 docs');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




































