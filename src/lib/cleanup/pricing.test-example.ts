// === Pricing Function Examples ===
// This file demonstrates the pricing calculation logic
// Run with: npx ts-node src/lib/cleanup/pricing.test-example.ts

import { calculatePrice, calculateNextPrice, PRICING_CONFIG } from './pricing';

/**
 * Example usage of pricing functions
 * This demonstrates the pricing curve for different participant counts
 */
export function demonstratePricing() {
  console.log('=== Community Cleanup Pricing Examples ===\n');
  console.log(`Base Price: ₹${PRICING_CONFIG.BASE_PRICE}`);
  console.log(`Floor Price: ₹${PRICING_CONFIG.FLOOR_PRICE}`);
  console.log(`Max Participants: ${PRICING_CONFIG.MAX_PARTICIPANTS}\n`);
  
  console.log('Price per participant by count:');
  console.log('-----------------------------------');
  
  const testCounts = [1, 2, 3, 5, 10, 15, 20, 25];
  
  for (const count of testCounts) {
    const price = calculatePrice(count);
    const nextPrice = calculateNextPrice(count);
    console.log(
      `${count.toString().padStart(2)} participant(s): ₹${price.toString().padStart(3)}` +
      (count < 20 ? ` → Next: ₹${nextPrice}` : ' (floor)')
    );
  }
  
  console.log('\n=== Pricing Logic ===');
  console.log('- Price decreases linearly from ₹649 to ₹99');
  console.log('- First participant pays ₹649');
  console.log('- Each additional participant reduces price');
  console.log('- At 20+ participants, price floors at ₹99');
  console.log('- Formula: basePrice - (discountPerParticipant * (count - 1))');
}

// Uncomment to run:
// demonstratePricing();

