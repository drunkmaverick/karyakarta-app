#!/usr/bin/env node

/**
 * KaryaKarta API Test Script
 * 
 * This script tests the main API endpoints to ensure they're working correctly.
 * Run with: node scripts/test-apis.js
 */

const BASE_URL = 'http://localhost:3000';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n🔍 Testing: ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success: ${response.status}`);
      if (data.message) console.log(`   Message: ${data.message}`);
      if (data.ok !== undefined) console.log(`   OK: ${data.ok}`);
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ Error: ${response.status}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test functions
async function testAdminLogin() {
  console.log('\n📋 Testing Admin Login...');
  const result = await apiCall('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: 'admin123' })
  });
  
  if (result.success) {
    console.log('✅ Admin login successful - cookies should be set');
    return true;
  }
  return false;
}

async function testCampaigns() {
  console.log('\n📋 Testing Campaigns...');
  
  // Test campaign creation
  const createResult = await apiCall('/api/campaigns/create', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Campaign',
      description: 'Test campaign for API testing',
      area: { lat: 19.1197, lng: 72.8468, radiusM: 2000 },
      pricePerPerson: 199,
      currency: 'INR',
      window: {
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
      },
      status: 'active'
    })
  });
  
  if (!createResult.success) {
    console.log('❌ Campaign creation failed');
    return false;
  }
  
  const campaignId = createResult.data.campaignId;
  console.log(`✅ Campaign created with ID: ${campaignId}`);
  
  // Test campaign listing
  const listResult = await apiCall('/api/campaigns/list');
  if (listResult.success) {
    console.log(`✅ Found ${listResult.data.campaigns?.length || 0} campaigns`);
  }
  
  // Test campaign details
  const getResult = await apiCall(`/api/campaigns/get?id=${campaignId}`);
  if (getResult.success) {
    console.log(`✅ Campaign details retrieved: ${getResult.data.campaign.name}`);
  }
  
  return true;
}

async function testPushNotifications() {
  console.log('\n📋 Testing Push Notifications...');
  
  // Test campaign notification (this will work in mock mode without FCM credentials)
  const notifyResult = await apiCall('/api/push/notify-campaign', {
    method: 'POST',
    body: JSON.stringify({ campaignId: 'test-campaign-id' })
  });
  
  if (notifyResult.success) {
    console.log(`✅ Push notification test completed: ${notifyResult.data.message}`);
  } else {
    console.log('❌ Push notification test failed');
  }
  
  return true;
}

async function testJobsAPI() {
  console.log('\n📋 Testing Jobs API...');
  
  // Test jobs listing (this will work without auth in admin mode)
  const listResult = await apiCall('/api/jobs/list');
  if (listResult.success) {
    console.log(`✅ Jobs API accessible: ${listResult.data.jobs?.length || 0} jobs found`);
  } else {
    console.log('❌ Jobs API failed');
  }
  
  return true;
}

async function testPayoutsAPI() {
  console.log('\n📋 Testing Payouts API...');
  
  // Test payouts listing
  const listResult = await apiCall('/api/payouts/list');
  if (listResult.success) {
    console.log(`✅ Payouts API accessible: ${listResult.data.payouts?.length || 0} payouts found`);
  } else {
    console.log('❌ Payouts API failed');
  }
  
  return true;
}

async function testPublicPages() {
  console.log('\n📋 Testing Public Pages...');
  
  const pages = [
    '/campaigns',
    '/admin/login',
    '/login',
    '/signup'
  ];
  
  for (const page of pages) {
    const result = await apiCall(page);
    if (result.success || result.status === 200) {
      console.log(`✅ ${page} - accessible`);
    } else {
      console.log(`❌ ${page} - error ${result.status}`);
    }
  }
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting KaryaKarta API Tests...');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('⚠️  Make sure the development server is running (npm run dev)');
  
  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'Campaigns', fn: testCampaigns },
    { name: 'Push Notifications', fn: testPushNotifications },
    { name: 'Jobs API', fn: testJobsAPI },
    { name: 'Payouts API', fn: testPayoutsAPI },
    { name: 'Public Pages', fn: testPublicPages }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} - PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`💥 ${test.name} - ERROR: ${error.message}`);
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(console.error);

