// scripts/seed.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccount.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function run() {
  console.log('⏳ Seeding Firestore with baseline data...');

  const users = db.collection('users');
  const providers = db.collection('service_providers');
  const campaigns = db.collection('community_campaigns');

  const batch = db.batch();

  const customerRef = users.doc();
  batch.set(customerRef, {
    uid: customerRef.id,
    name: 'Test Customer',
    email: 'testcustomer@example.com',
    role: 'customer',
    createdAt: FieldValue.serverTimestamp(),
  });

  const spRef = providers.doc();
  batch.set(spRef, {
    id: spRef.id,
    userId: null,
    name: 'Ravi Kumar',
    phone: '+91 98765 43210',
    city: 'New Delhi',
    skills: ['community_cleaning'],
    rating: 4.7,
    jobsCompleted: 12,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  const campRef = campaigns.doc();
  batch.set(campRef, {
    id: campRef.id,
    title: 'Sector 12 Park Cleanup',
    description: 'Join the local community to clean Sector 12 Park. Gloves and bags provided.',
    location: { lat: 28.6139, lng: 77.2090, name: 'Sector 12 Park, Dwarka' },
    radiusMeters: 800,
    date: '2025-08-20',
    startTime: '09:00',
    status: 'scheduled',
    createdBy: customerRef.id,
    participants: [customerRef.id],
    participantCount: 1,
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  console.log('✅ Seed complete.');
  console.log(`- users:              ${customerRef.id}`);
  console.log(`- service_providers:  ${spRef.id}`);
  console.log(`- community_campaigns:${campRef.id}`);
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});