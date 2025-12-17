// === Community Cleanup Pricing Logic ===

/**
 * Pricing Configuration Constants
 */
export const PRICING_CONFIG = {
  BASE_PRICE: 649,        // Starting price in rupees (₹649)
  FLOOR_PRICE: 99,        // Minimum price in rupees (₹99)
  MAX_PARTICIPANTS: 20,   // Theoretical max for calculation
} as const;

/**
 * Calculates price per participant based on current participant count.
 * 
 * Formula: Linear decay from basePrice to floorPrice
 * - Base: ₹649 (1 participant)
 * - Floor: ₹99 (max participants)
 * - Decay rate: (649 - 99) / (maxParticipants - 1)
 * 
 * @param participantCount - Current number of participants (min: 1)
 * @param basePrice - Starting price (default: ₹649)
 * @param floorPrice - Minimum price (default: ₹99)
 * @param maxParticipants - Theoretical max for calculation (default: 20)
 * @returns Price per participant in rupees (rounded to nearest integer)
 * 
 * @example
 * calculatePrice(1)   // Returns 649
 * calculatePrice(2)   // Returns ~620
 * calculatePrice(5)   // Returns ~471
 * calculatePrice(10)  // Returns ~285
 * calculatePrice(20)  // Returns 99
 * calculatePrice(25)  // Returns 99 (floor)
 */
export function calculatePrice(
  participantCount: number,
  basePrice: number = PRICING_CONFIG.BASE_PRICE,
  floorPrice: number = PRICING_CONFIG.FLOOR_PRICE,
  maxParticipants: number = PRICING_CONFIG.MAX_PARTICIPANTS
): number {
  // Ensure minimum 1 participant
  const count = Math.max(1, participantCount);
  
  // If at or above max, return floor price
  if (count >= maxParticipants) {
    return floorPrice;
  }
  
  // Linear interpolation formula
  // Price decreases linearly from basePrice to floorPrice
  // as participant count increases from 1 to maxParticipants
  const priceRange = basePrice - floorPrice;
  const participantRange = maxParticipants - 1;
  const discountPerParticipant = priceRange / participantRange;
  
  // Calculate price: basePrice - (discount * (count - 1))
  // count - 1 because first participant pays basePrice
  const calculatedPrice = basePrice - (discountPerParticipant * (count - 1));
  
  // Ensure price doesn't go below floor
  return Math.max(floorPrice, Math.round(calculatedPrice));
}

/**
 * Calculates the price for the next participant (before they join).
 * This is useful for displaying "Join for ₹X" messages.
 * 
 * @param currentParticipantCount - Current number of participants
 * @returns Price the next participant will pay
 */
export function calculateNextPrice(currentParticipantCount: number): number {
  return calculatePrice(currentParticipantCount + 1);
}

/**
 * Converts rupees to paise (for Razorpay integration).
 * 
 * @param rupees - Amount in rupees
 * @returns Amount in paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts paise to rupees.
 * 
 * @param paise - Amount in paise
 * @returns Amount in rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Validates that a price is within acceptable bounds.
 * 
 * @param price - Price to validate
 * @returns true if price is valid
 */
export function isValidPrice(price: number): boolean {
  return (
    price >= PRICING_CONFIG.FLOOR_PRICE &&
    price <= PRICING_CONFIG.BASE_PRICE &&
    Number.isInteger(price)
  );
}

