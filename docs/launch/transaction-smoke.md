# Transaction Smoke Test Documentation

This document provides detailed curl commands and expected responses for testing the KaryaKarta payment integration.

## Test Environment Setup

```bash
# Start the development server
USE_MOCK=1 npm run dev

# Or for real mode testing
USE_MOCK=0 npm run dev
```

## Test Scenarios

### 1. Transaction Creation

**Endpoint:** `POST /api/transactions/create`

```bash
curl -X POST http://localhost:3000/api/transactions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{
    "jobId": "test-job-123",
    "amount": 500,
    "currency": "INR"
  }'
```

**Expected Response (Mock Mode):**
```json
{
  "ok": true,
  "transactionId": "mock_transaction_1757927539509",
  "orderId": "mock_order_1757927539509",
  "amount": 500,
  "currency": "INR"
}
```

**Expected Response (Real Mode):**
```json
{
  "ok": true,
  "transactionId": "abc123def456",
  "orderId": "order_xyz789",
  "amount": 500,
  "currency": "INR"
}
```

### 2. Webhook Simulation

**Endpoint:** `POST /api/transactions/webhook`

```bash
curl -X POST http://localhost:3000/api/transactions/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.captured",
    "contains": ["payment"],
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "amount": 50000,
          "currency": "INR",
          "status": "captured",
          "order_id": "mock_order_1757927539509",
          "method": "card",
          "description": "Test payment",
          "created_at": 1757927539
        }
      }
    },
    "created_at": 1757927539
  }'
```

**Expected Response (Mock Mode):**
```json
{
  "ok": true,
  "mode": "mock"
}
```

**Expected Response (Real Mode):**
```json
{
  "ok": true
}
```

### 3. Transaction List

**Endpoint:** `GET /api/transactions/list`

```bash
curl -X GET http://localhost:3000/api/transactions/list \
  -H "Authorization: Bearer mock-token"
```

**Expected Response:**
```json
{
  "ok": true,
  "items": [
    {
      "id": "mock_transaction_1757927539509",
      "jobId": "test-job-123",
      "amount": 500,
      "currency": "INR",
      "status": "succeeded",
      "customerId": "mock-user-id",
      "paymentProvider": "razorpay",
      "providerOrderId": "mock_order_1757927539509",
      "providerPaymentId": "pay_test123",
      "createdAt": "2025-01-15T09:19:14.191Z",
      "updatedAt": "2025-01-15T09:19:15.191Z"
    }
  ],
  "nextCursor": null
}
```

### 4. Provider Transactions

**Endpoint:** `GET /api/provider/transactions`

```bash
curl -X GET http://localhost:3000/api/provider/transactions \
  -H "Authorization: Bearer mock-token"
```

**Expected Response:**
```json
{
  "ok": true,
  "items": [],
  "nextCursor": null
}
```

## Error Scenarios

### 1. Missing Authorization

```bash
curl -X POST http://localhost:3000/api/transactions/create \
  -H "Content-Type: application/json" \
  -d '{"jobId": "test-job-123", "amount": 500}'
```

**Expected Response:**
```json
{
  "ok": false,
  "error": "Authorization token required"
}
```

### 2. Invalid Transaction Data

```bash
curl -X POST http://localhost:3000/api/transactions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{"jobId": "", "amount": -100}'
```

**Expected Response:**
```json
{
  "ok": false,
  "error": "Job ID and amount are required"
}
```

### 3. Invalid Webhook Signature (Real Mode)

```bash
curl -X POST http://localhost:3000/api/transactions/webhook \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: invalid_signature" \
  -d '{"event": "payment.captured", "payload": {}}'
```

**Expected Response:**
```json
{
  "ok": false,
  "error": "Invalid signature"
}
```

## Test Automation

### Complete Flow Test

```bash
#!/bin/bash
# Complete transaction flow test

echo "Creating transaction..."
TRANSACTION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/transactions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-token" \
  -d '{"jobId": "test-job-123", "amount": 500, "currency": "INR"}')

echo "Transaction response: $TRANSACTION_RESPONSE"

# Extract order ID
ORDER_ID=$(echo "$TRANSACTION_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
echo "Order ID: $ORDER_ID"

echo "Simulating webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/transactions/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"payment.captured\",
    \"contains\": [\"payment\"],
    \"payload\": {
      \"payment\": {
        \"entity\": {
          \"id\": \"pay_test123\",
          \"amount\": 50000,
          \"currency\": \"INR\",
          \"status\": \"captured\",
          \"order_id\": \"$ORDER_ID\",
          \"method\": \"card\",
          \"description\": \"Test payment\",
          \"created_at\": $(date +%s)
        }
      }
    },
    \"created_at\": $(date +%s)
  }")

echo "Webhook response: $WEBHOOK_RESPONSE"

echo "Listing transactions..."
LIST_RESPONSE=$(curl -s -X GET http://localhost:3000/api/transactions/list \
  -H "Authorization: Bearer mock-token")

echo "List response: $LIST_RESPONSE"
```

## Performance Benchmarks

### Expected Response Times

- Transaction Creation: < 2 seconds
- Webhook Processing: < 1 second
- Transaction List: < 1 second
- Provider Transactions: < 1 second

### Load Testing

```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/transactions/create \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer mock-token" \
    -d "{\"jobId\": \"test-job-$i\", \"amount\": 500}" &
done
wait
```

## Monitoring & Logging

### Key Metrics to Monitor

1. **Transaction Success Rate**
   - Successful transactions / Total attempts
   - Target: > 95%

2. **Webhook Processing Time**
   - Time from webhook receipt to processing
   - Target: < 5 seconds

3. **API Response Times**
   - Average response time for all endpoints
   - Target: < 2 seconds

4. **Error Rates**
   - Failed transactions / Total transactions
   - Target: < 5%

### Log Analysis

```bash
# Check transaction logs
grep "Transaction" logs/app.log | tail -20

# Check webhook logs
grep "Webhook" logs/app.log | tail -20

# Check error logs
grep "ERROR" logs/app.log | tail -20
```

## Troubleshooting Guide

### Common Issues

1. **Transaction Creation Fails**
   - Check Razorpay API keys
   - Verify Firebase connection
   - Check job exists in database

2. **Webhook Not Processing**
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Review Razorpay webhook logs

3. **Push Notifications Not Sent**
   - Check FCM configuration
   - Verify push tokens are registered
   - Check notification permissions

### Debug Commands

```bash
# Check environment variables
curl -s http://localhost:3000/api/dev/env

# Test Firebase connection
curl -s http://localhost:3000/api/dev/env-check

# Check health status
curl -s http://localhost:3000/api/health
```









