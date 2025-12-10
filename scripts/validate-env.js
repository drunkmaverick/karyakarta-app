#!/usr/bin/env node

/**
 * Environment variable validation script
 * Ensures required environment variables are set based on feature flags
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Check if payments are enabled
const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

console.log('🔍 Validating environment variables...');
console.log(`📊 Payments enabled: ${paymentsEnabled}`);

const errors = [];
const warnings = [];

// Required environment variables for all environments
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_PROJECT_ID',
  'GCLOUD_PROJECT'
];

// Required environment variables when payments are enabled
const requiredPaymentEnvVars = [
  'RAZORPAY_KEY_ID_TEST',
  'RAZORPAY_KEY_SECRET_TEST',
  'NEXT_PUBLIC_RAZORPAY_KEY_TEST',
  'RAZORPAY_WEBHOOK_SECRET_TEST'
];

// Check required environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    errors.push(`❌ Missing required environment variable: ${envVar}`);
  } else {
    console.log(`✅ ${envVar}: ${process.env[envVar].substring(0, 10)}...`);
  }
});

// Check payment-related environment variables
if (paymentsEnabled) {
  console.log('\n💳 Checking payment-related environment variables...');
  
  requiredPaymentEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`❌ Missing required payment environment variable: ${envVar}`);
    } else {
      console.log(`✅ ${envVar}: ${process.env[envVar].substring(0, 10)}...`);
    }
  });
} else {
  console.log('\n🚫 Payments disabled - skipping payment environment variable validation');
  
  // Check if payment keys are present when payments are disabled (warning)
  requiredPaymentEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      warnings.push(`⚠️  Payment environment variable ${envVar} is set but payments are disabled`);
    }
  });
}

// Check for potentially exposed sensitive data
const sensitivePatterns = [
  { pattern: /rzp_live_/, name: 'Live Razorpay keys' },
  { pattern: /sk_live_/, name: 'Live Stripe keys' },
  { pattern: /pk_live_/, name: 'Live Stripe public keys' }
];

sensitivePatterns.forEach(({ pattern, name }) => {
  Object.entries(process.env).forEach(([key, value]) => {
    if (value && pattern.test(value)) {
      warnings.push(`⚠️  Potentially sensitive ${name} detected in ${key}`);
    }
  });
});

// Print results
console.log('\n📋 Validation Results:');

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(`   ${warning}`));
}

if (errors.length > 0) {
  console.log('\n❌ Errors:');
  errors.forEach(error => console.log(`   ${error}`));
  console.log('\n💡 To fix these errors:');
  console.log('   1. Copy .env.example to .env.local');
  console.log('   2. Fill in the required values');
  console.log('   3. Run this script again');
  process.exit(1);
} else {
  console.log('\n✅ All environment variables are properly configured!');
  
  if (paymentsEnabled) {
    console.log('💳 Payment functionality is enabled');
  } else {
    console.log('🚫 Payment functionality is disabled');
  }
}
