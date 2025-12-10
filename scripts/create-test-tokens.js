const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function createTestTokens() {
  try {
    console.log('🔑 Creating test push tokens...');

    // Create test push tokens with location data
    const testTokens = [
      {
        uid: 'test-customer-1',
        token: 'test-fcm-token-1',
        lat: 19.100,
        lng: 72.826,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        uid: 'test-customer-2', 
        token: 'test-fcm-token-2',
        lat: 19.105,
        lng: 72.830,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        uid: 'test-customer-3',
        token: 'test-fcm-token-3',
        lat: 19.120,
        lng: 72.840,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const tokenData of testTokens) {
      await db.collection('pushTokens').add(tokenData);
      console.log(`✅ Created token for user ${tokenData.uid} at ${tokenData.lat}, ${tokenData.lng}`);
    }

    console.log('🎉 Test push tokens created successfully!');

  } catch (error) {
    console.error('❌ Error creating test tokens:', error);
    process.exit(1);
  }
}

createTestTokens().then(() => {
  console.log('✅ Token creation completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Token creation failed:', error);
  process.exit(1);
});
















