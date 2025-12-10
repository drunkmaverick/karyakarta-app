/**
 * App version utilities
 * Provides version information from package.json and build-time data
 */

// Import package.json version at build time
const packageJson = require('../../package.json');

export interface AppVersion {
  version: string;
  name: string;
  buildDate: string;
  buildTime: string;
  environment: string;
  androidVersionCode?: number;
  androidVersionName?: string;
}

/**
 * Get the current app version information
 */
export function getAppVersion(): AppVersion {
  const now = new Date();
  
  return {
    version: packageJson.version,
    name: packageJson.name,
    buildDate: now.toISOString().split('T')[0], // YYYY-MM-DD
    buildTime: now.toISOString(),
    environment: process.env.NODE_ENV || 'development',
    // Android version info will be populated at runtime if available
    androidVersionCode: undefined,
    androidVersionName: undefined
  };
}

/**
 * Get version info for display in UI
 */
export function getVersionDisplayInfo(): {
  appVersion: string;
  buildInfo: string;
  environment: string;
} {
  const version = getAppVersion();
  
  return {
    appVersion: version.version,
    buildInfo: `${version.buildDate} (${version.environment})`,
    environment: version.environment
  };
}

/**
 * Format version for display
 */
export function formatVersion(version: AppVersion): string {
  return `${version.name} v${version.version}`;
}

/**
 * Get build info string
 */
export function getBuildInfo(): string {
  const version = getAppVersion();
  return `Build ${version.buildDate} (${version.environment})`;
}
