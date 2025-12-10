/**
 * Feature flags for the application
 * These control which features are enabled/disabled
 */

export const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
