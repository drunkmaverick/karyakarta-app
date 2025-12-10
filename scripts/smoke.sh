#!/bin/bash

# KaryaKarta Smoke Tests
# Tests the complete flow from admin login to campaign creation and push notifications

set -e

BASE_URL="http://localhost:3000"
COOKIES_FILE="cookies.txt"

echo "🧪 Starting KaryaKarta Smoke Tests..."

# Clean up any existing cookies
rm -f $COOKIES_FILE

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
echo "Health response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test 2: Admin Login
echo "2️⃣ Testing admin login..."
LOGIN_RESPONSE=$(curl -i -c $COOKIES_FILE -X POST "$BASE_URL/api/admin/login" \
  -H 'content-type: application/json' \
  --data-binary '{"password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Admin login successful"
else
    echo "❌ Admin login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 3: Create Campaign
echo "3️⃣ Testing campaign creation..."
CAMPAIGN_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST "$BASE_URL/api/campaigns/create" \
  -H 'content-type: application/json' \
  --data '{"title":"Smoke Test Campaign","areaName":"Powai","center":{"lat":19.12,"lng":72.91},"radiusKm":2,"status":"draft"}')

echo "Campaign response: $CAMPAIGN_RESPONSE"

if echo "$CAMPAIGN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Campaign creation successful"
    # Extract campaign ID for later tests
    CAMPAIGN_ID=$(echo "$CAMPAIGN_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Campaign ID: $CAMPAIGN_ID"
else
    echo "❌ Campaign creation failed"
    exit 1
fi

# Test 4: List Campaigns
echo "4️⃣ Testing campaign listing..."
LIST_RESPONSE=$(curl -s -b $COOKIES_FILE "$BASE_URL/api/campaigns/list")

if echo "$LIST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Campaign listing successful"
else
    echo "❌ Campaign listing failed"
    exit 1
fi

# Test 5: Get Specific Campaign
if [ ! -z "$CAMPAIGN_ID" ]; then
    echo "5️⃣ Testing campaign retrieval..."
    GET_RESPONSE=$(curl -s -b $COOKIES_FILE "$BASE_URL/api/campaigns/get?id=$CAMPAIGN_ID")
    
    if echo "$GET_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Campaign retrieval successful"
    else
        echo "❌ Campaign retrieval failed"
        exit 1
    fi
fi

# Test 6: Dry Run Push Notification
if [ ! -z "$CAMPAIGN_ID" ]; then
    echo "6️⃣ Testing dry run push notification..."
    DRY_RUN_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST "$BASE_URL/api/push/notify-campaign?dryRun=true" \
      -H 'content-type: application/json' \
      --data "{\"campaignId\":\"$CAMPAIGN_ID\",\"radiusKm\":2}")
    
    echo "Dry run response: $DRY_RESPONSE"
    
    if echo "$DRY_RUN_RESPONSE" | grep -q '"ok":true'; then
        echo "✅ Dry run push notification successful"
    else
        echo "❌ Dry run push notification failed"
        exit 1
    fi
fi

# Test 7: Register Push Token (Mock)
echo "7️⃣ Testing push token registration..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/push/register-token" \
  -H 'content-type: application/json' \
  --data '{"token":"test_token_123","userId":"test_user","role":"customer","lat":19.12,"lng":72.91}')

echo "Token registration response: $TOKEN_RESPONSE"

if echo "$TOKEN_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Push token registration successful"
else
    echo "❌ Push token registration failed"
    exit 1
fi

# Test 8: Test Push Notification
echo "8️⃣ Testing push notification..."
PUSH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/push/test" \
  -H 'content-type: application/json' \
  --data '{"token":"test_token_123"}')

echo "Push test response: $PUSH_RESPONSE"

if echo "$PUSH_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Push notification test successful"
else
    echo "❌ Push notification test failed"
    exit 1
fi

# Test 9: Unregister Push Token
echo "9️⃣ Testing push token unregistration..."
UNREGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/push/unregister-token" \
  -H 'content-type: application/json' \
  --data '{"token":"test_token_123"}')

echo "Token unregistration response: $UNREGISTER_RESPONSE"

if echo "$UNREGISTER_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Push token unregistration successful"
else
    echo "❌ Push token unregistration failed"
    exit 1
fi

# Test 10: Customer Job Creation
echo "🔟 Testing customer job creation..."
CUSTOMER_TOKEN="mock-customer-123"
JOB_CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/jobs/create" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $CUSTOMER_TOKEN" \
  --data '{"serviceType":"deep_clean","scheduledForISO":"2025-10-01T10:00:00.000Z","address":"Powai, Mumbai","price":800}')

echo "Job creation response: $JOB_CREATE_RESPONSE"

if echo "$JOB_CREATE_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Customer job creation successful"
    # Extract job ID for later tests
    JOB_ID=$(echo "$JOB_CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Job ID: $JOB_ID"
else
    echo "❌ Customer job creation failed"
    exit 1
fi

# Test 11: Customer Job Listing
echo "1️⃣1️⃣ Testing customer job listing..."
CUSTOMER_JOBS_RESPONSE=$(curl -s -H "authorization: Bearer $CUSTOMER_TOKEN" \
  "$BASE_URL/api/jobs/by-customer?limit=5")

echo "Customer jobs response: $CUSTOMER_JOBS_RESPONSE"

if echo "$CUSTOMER_JOBS_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Customer job listing successful"
else
    echo "❌ Customer job listing failed"
    exit 1
fi

# Test 12: Provider Job Listing
echo "1️⃣2️⃣ Testing provider job listing..."
PROVIDER_TOKEN="mock-provider-123"
PROVIDER_JOBS_RESPONSE=$(curl -s -H "authorization: Bearer $PROVIDER_TOKEN" \
  "$BASE_URL/api/provider/jobs")

echo "Provider jobs response: $PROVIDER_JOBS_RESPONSE"

if echo "$PROVIDER_JOBS_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Provider job listing successful"
else
    echo "❌ Provider job listing failed"
    exit 1
fi

# Test 13: Provider Job Status Update (if job exists)
if [ ! -z "$JOB_ID" ]; then
    echo "1️⃣3️⃣ Testing provider job status update..."
    STATUS_UPDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/provider/jobs/update-status" \
      -H 'content-type: application/json' \
      -H "authorization: Bearer $PROVIDER_TOKEN" \
      --data "{\"jobId\":\"$JOB_ID\",\"to\":\"accepted\"}")
    
    echo "Status update response: $STATUS_UPDATE_RESPONSE"
    
    if echo "$STATUS_UPDATE_RESPONSE" | grep -q '"ok":true'; then
        echo "✅ Provider job status update successful"
    else
        echo "❌ Provider job status update failed"
        exit 1
    fi
fi

# Test 14: Provider Payouts
echo "1️⃣4️⃣ Testing provider payouts..."
PROVIDER_PAYOUTS_RESPONSE=$(curl -s -H "authorization: Bearer $PROVIDER_TOKEN" \
  "$BASE_URL/api/provider/payouts?limit=5")

echo "Provider payouts response: $PROVIDER_PAYOUTS_RESPONSE"

if echo "$PROVIDER_PAYOUTS_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Provider payouts successful"
else
    echo "❌ Provider payouts failed"
    exit 1
fi

# Test 15: Admin Logout
echo "1️⃣5️⃣ Testing admin logout..."
LOGOUT_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST "$BASE_URL/api/admin/logout")

if echo "$LOGOUT_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Admin logout successful"
else
    echo "❌ Admin logout failed"
    exit 1
fi

# Clean up
rm -f $COOKIES_FILE

echo ""
echo "🎉 All smoke tests passed! The app is working correctly."
echo ""
echo "📋 Test Summary:"
echo "  ✅ Health check"
echo "  ✅ Admin login"
echo "  ✅ Campaign creation"
echo "  ✅ Campaign listing"
echo "  ✅ Campaign retrieval"
echo "  ✅ Dry run push notification"
echo "  ✅ Push token registration"
echo "  ✅ Push notification test"
echo "  ✅ Push token unregistration"
echo "  ✅ Customer job creation"
echo "  ✅ Customer job listing"
echo "  ✅ Provider job listing"
echo "  ✅ Provider job status update"
echo "  ✅ Provider payouts"

# Test 12: Transaction Flow
echo "1️⃣2️⃣ Testing transaction flow..."
echo "  Creating transaction..."
TRANSACTION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{"jobId": "test-job-smoke", "amount": 500, "currency": "INR"}')

if echo "$TRANSACTION_RESPONSE" | grep -q '"ok":true'; then
    echo "  ✅ Transaction created"
    
    # Extract transaction ID for webhook test
    TRANSACTION_ID=$(echo "$TRANSACTION_RESPONSE" | grep -o '"transactionId":"[^"]*"' | cut -d'"' -f4)
    ORDER_ID=$(echo "$TRANSACTION_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
    
    echo "  Testing webhook simulation..."
    WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions/webhook" \
      -H "Content-Type: application/json" \
      -d "{
        \"event\": \"payment.captured\",
        \"contains\": [\"payment\"],
        \"payload\": {
          \"payment\": {
            \"entity\": {
              \"id\": \"pay_smoke123\",
              \"amount\": 50000,
              \"currency\": \"INR\",
              \"status\": \"captured\",
              \"order_id\": \"$ORDER_ID\",
              \"method\": \"card\",
              \"description\": \"Smoke test payment\",
              \"created_at\": $(date +%s)
            }
          }
        },
        \"created_at\": $(date +%s)
      }")
    
    if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
        echo "  ✅ Webhook processed successfully"
    else
        echo "  ❌ Webhook processing failed: $WEBHOOK_RESPONSE"
        exit 1
    fi
    
    echo "  Testing transaction list..."
    TRANSACTION_LIST_RESPONSE=$(curl -s "$BASE_URL/api/transactions/list" \
      -H "Authorization: Bearer mock-token")
    
    if echo "$TRANSACTION_LIST_RESPONSE" | grep -q '"ok":true'; then
        echo "  ✅ Transaction list retrieved"
    else
        echo "  ❌ Transaction list failed: $TRANSACTION_LIST_RESPONSE"
        exit 1
    fi
else
    echo "  ❌ Transaction creation failed: $TRANSACTION_RESPONSE"
    exit 1
fi

echo "  ✅ Admin logout"

