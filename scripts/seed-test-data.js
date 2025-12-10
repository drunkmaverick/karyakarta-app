const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function seedTestData() {
  try {
    console.log('🌱 Starting to seed test data...');

    // Create test customer
    const customerId = 'test-customer-123';
    const customerData = {
      email: 'customer@test.com',
      name: 'Test Customer',
      phone: '+1234567890',
      lastKnownLocation: {
        lat: 19.117,
        lng: 72.905,
        updatedAt: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('customers').doc(customerId).set(customerData);
    console.log('✅ Created test customer:', customerId);

    // Create test provider
    const providerId = 'test-provider-456';
    const providerData = {
      email: 'provider@test.com',
      name: 'Test Provider',
      phone: '+1234567891',
      ratingAvg: 4.5,
      ratingCount: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('providers').doc(providerId).set(providerData);
    console.log('✅ Created test provider:', providerId);

    // Create test job
    const jobId = 'test-job-789';
    const jobData = {
      customerId,
      providerId,
      service: 'deep_cleaning',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'created',
      amount: 1500,
      currency: 'INR',
      address: '123 Test Street, Mumbai, India',
      notes: 'Please clean the living room and kitchen thoroughly',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('jobs').doc(jobId).set(jobData);
    console.log('✅ Created test job:', jobId);

    // Create test campaign
    const campaignId = 'test-campaign-101';
    const campaignData = {
      title: 'Mumbai Beach Cleanup',
      description: 'Join us for a community beach cleanup at Juhu Beach',
      areaName: 'Juhu Beach',
      radiusKm: 2,
      center: { lat: 19.100, lng: 72.826 },
      imageUrl: 'https://example.com/beach-cleanup.jpg',
      afterImageUrl: 'https://example.com/beach-cleanup-after.jpg',
      status: 'live',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('campaigns').doc(campaignId).set(campaignData);
    console.log('✅ Created test campaign:', campaignId);

    // Create test push token
    const pushTokenId = 'test-token-202';
    const pushTokenData = {
      uid: customerId,
      token: 'test-fcm-token-12345',
      lat: 19.117,
      lng: 72.905,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('pushTokens').doc(pushTokenId).set(pushTokenData);
    console.log('✅ Created test push token:', pushTokenId);

    console.log('🎉 Test data seeded successfully!');
    console.log('\nTest Data Summary:');
    console.log('- Customer ID:', customerId);
    console.log('- Provider ID:', providerId);
    console.log('- Job ID:', jobId);
    console.log('- Campaign ID:', campaignId);
    console.log('- Push Token ID:', pushTokenId);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTestData().then(() => {
  console.log('✅ Seeding completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
















