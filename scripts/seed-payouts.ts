import { db } from '@/app/lib/firebase-admin';

async function main() {
  const payouts = [
    { providerId: 'prov_001', amount: 1200, currency: 'INR', status: 'pending', notes: 'Weekly cleaning' },
    { providerId: 'prov_002', amount: 800, currency: 'INR', status: 'completed', notes: 'Deep clean' },
    { providerId: 'prov_003', amount: 1500, currency: 'INR', status: 'processing', notes: 'Annual service' },
  ];

  for (const p of payouts) {
    const doc = await db.collection('payouts').add({
      ...p,
      source: 'seed-script',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Seeded payout ${doc.id} for provider ${p.providerId}`);
  }
  process.exit(0);
}

main().catch(e => {
  console.error('Seed failed', e);
  process.exit(1);
});
