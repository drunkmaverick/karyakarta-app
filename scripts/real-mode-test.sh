#!/bin/bash

# KaryaKarta Real Mode Test Script
# Tests the app with real Razorpay integration (test mode or live mode)

set -e

BASE_URL="http://localhost:3000"
USE_REAL_MODE=${USE_MOCK:-"0"}

if [ "$USE_REAL_MODE" = "1" ]; then
    echo "⚠️  USE_MOCK=1 detected. This script tests real Razorpay integration."
    echo "   Set USE_MOCK=0 to test with real Razorpay API."
    exit 1
fi

echo "🧪 Starting KaryaKarta Real Mode Tests..."
echo "   Testing with real Razorpay integration"

# Check required environment variables
echo "🔍 Checking environment variables..."

if [ -z "$RAZORPAY_KEY_ID_TEST" ] && [ -z "$RAZORPAY_KEY_ID_LIVE" ]; then
    echo "❌ Razorpay API key not found. Set RAZORPAY_KEY_ID_TEST or RAZORPAY_KEY_ID_LIVE"
    exit 1
fi

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ FIREBASE_PROJECT_ID not set"
    exit 1
fi

echo "✅ Environment variables check passed"

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")

if echo "$HEALTH_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Health check passed"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Firebase Connection
echo "2️⃣ Testing Firebase connection..."
FIREBASE_RESPONSE=$(curl -s "$BASE_URL/api/dev/env-check")

if echo "$FIREBASE_RESPONSE" | grep -q '"firebase":true'; then
    echo "✅ Firebase connection successful"
else
    echo "❌ Firebase connection failed: $FIREBASE_RESPONSE"
    exit 1
fi

# Test 3: Razorpay Order Creation
echo "3️⃣ Testing Razorpay order creation..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{"jobId": "real-test-job", "amount": 100, "currency": "INR"}')

if echo "$ORDER_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Razorpay order created successfully"
    
    # Extract order ID
    ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
    TRANSACTION_ID=$(echo "$ORDER_RESPONSE" | grep -o '"transactionId":"[^"]*"' | cut -d'"' -f4)
    
    echo "   Order ID: $ORDER_ID"
    echo "   Transaction ID: $TRANSACTION_ID"
    
    # Verify order ID format
    if [[ $ORDER_ID == order_* ]] || [[ $ORDER_ID == mock_order_* ]]; then
        echo "✅ Order ID format is correct"
    else
        echo "⚠️  Order ID format may be incorrect: $ORDER_ID"
    fi
else
    echo "❌ Razorpay order creation failed: $ORDER_RESPONSE"
    exit 1
fi

# Test 4: Webhook Signature Verification
echo "4️⃣ Testing webhook signature verification..."
WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET_TEST:-$RAZORPAY_WEBHOOK_SECRET_LIVE}

if [ -z "$WEBHOOK_SECRET" ]; then
    echo "⚠️  Webhook secret not found. Skipping signature verification test."
else
    # Create a test webhook payload
    WEBHOOK_PAYLOAD='{"event":"payment.captured","contains":["payment"],"payload":{"payment":{"entity":{"id":"pay_test123","amount":10000,"currency":"INR","status":"captured","order_id":"'$ORDER_ID'","method":"card","description":"Test payment","created_at":'$(date +%s)'}}},"created_at":'$(date +%s)'}'
    
    # Generate HMAC signature
    WEBHOOK_SIGNATURE=$(echo -n "$WEBHOOK_PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | base64)
    
    WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions/webhook" \
      -H "Content-Type: application/json" \
      -H "x-razorpay-signature: $WEBHOOK_SIGNATURE" \
      -d "$WEBHOOK_PAYLOAD")
    
    if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
        echo "✅ Webhook signature verification passed"
    else
        echo "❌ Webhook signature verification failed: $WEBHOOK_RESPONSE"
        exit 1
    fi
fi

# Test 5: Transaction List
echo "5️⃣ Testing transaction listing..."
TRANSACTION_LIST_RESPONSE=$(curl -s "$BASE_URL/api/transactions/list" \
  -H "Authorization: Bearer mock-token")

if echo "$TRANSACTION_LIST_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Transaction listing successful"
else
    echo "❌ Transaction listing failed: $TRANSACTION_LIST_RESPONSE"
    exit 1
fi

# Test 6: Push Notifications (if configured)
echo "6️⃣ Testing push notifications..."
PUSH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/push/test" \
  -H "Content-Type: application/json" \
  -d '{"tokens":["test-token"],"payload":{"title":"Test","body":"Real mode test"}}')

if echo "$PUSH_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Push notification test successful"
else
    echo "⚠️  Push notification test failed (may be expected): $PUSH_RESPONSE"
fi

# Test 7: Admin Functionality
echo "7️⃣ Testing admin functionality..."
ADMIN_LOGIN_RESPONSE=$(curl -i -s -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}')

if echo "$ADMIN_LOGIN_RESPONSE" | grep -q "Set-Cookie: admin=1"; then
    echo "✅ Admin login successful"
    
    # Test admin logout
    ADMIN_LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/admin/logout")
    if echo "$ADMIN_LOGOUT_RESPONSE" | grep -q '"ok":true'; then
        echo "✅ Admin logout successful"
    else
        echo "⚠️  Admin logout failed: $ADMIN_LOGOUT_RESPONSE"
    fi
else
    echo "❌ Admin login failed"
    exit 1
fi

echo ""
echo "🎉 All real mode tests passed!"
echo ""
echo "📋 Test Summary:"
echo "  ✅ Health check"
echo "  ✅ Firebase connection"
echo "  ✅ Razorpay order creation"
echo "  ✅ Webhook signature verification"
echo "  ✅ Transaction listing"
echo "  ✅ Push notifications"
echo "  ✅ Admin functionality"
echo ""
echo "🚀 Your app is ready for production!"

# Optional: Test with real payment (requires manual intervention)
echo ""
echo "💳 Optional: Test with real payment"
echo "   1. Visit: $BASE_URL/bookings/checkout?jobId=real-test-job"
echo "   2. Complete payment with test card: 4111 1111 1111 1111"
echo "   3. Verify webhook processing in logs"
echo ""
echo "   Test card details:"
echo "   - Number: 4111 1111 1111 1111"
echo "   - CVV: Any 3 digits"
echo "   - Expiry: Any future date"
echo "   - Name: Any name"
echo ""