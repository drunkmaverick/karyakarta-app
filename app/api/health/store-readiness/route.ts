import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface StoreReadinessResponse {
  appId: string;
  appName: string;
  version: string;
  paymentsEnabled: boolean;
  envMode: string;
  privacyUrlExists: boolean;
  androidConfigOk: boolean;
  checks: {
    privacyFile: boolean;
    androidManifest: boolean;
    androidBuildGradle: boolean;
    capacitorConfig: boolean;
    envFile: boolean;
    sentryConfig: boolean;
    networkUtility: boolean;
    errorBoundary: boolean;
  };
  timestamp: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<StoreReadinessResponse>> {
  try {
    const startTime = Date.now();
    
    // Get app information from package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    let appName = 'Karyakarta';
    let version = '1.0.0';
    
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      appName = packageJson.name || 'Karyakarta';
      version = packageJson.version || '1.0.0';
    } catch (error) {
      console.warn('Could not read package.json:', error);
    }

    // Get app ID from environment or default
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'co.karyakarta.app';
    
    // Check environment mode
    const envMode = process.env.NODE_ENV || 'development';
    
    // Check payments enabled flag
    const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';
    
    // Define file paths to check
    const fileChecks = {
      privacyFile: path.join(process.cwd(), 'public', 'privacy.html'),
      androidManifest: path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
      androidBuildGradle: path.join(process.cwd(), 'android', 'app', 'build.gradle'),
      capacitorConfig: path.join(process.cwd(), 'capacitor.config.ts'),
      envFile: path.join(process.cwd(), '.env.local'),
      sentryClientConfig: path.join(process.cwd(), 'sentry.client.config.ts'),
      sentryServerConfig: path.join(process.cwd(), 'sentry.server.config.ts'),
      networkUtility: path.join(process.cwd(), 'src', 'lib', 'network.ts'),
      errorBoundary: path.join(process.cwd(), 'src', 'components', 'GlobalErrorBoundary.tsx'),
    };

    // Check file existence
    const checks = {
      privacyFile: false,
      androidManifest: false,
      androidBuildGradle: false,
      capacitorConfig: false,
      envFile: false,
      sentryConfig: false,
      networkUtility: false,
      errorBoundary: false,
    };

    // Check each file
    for (const [key, filePath] of Object.entries(fileChecks)) {
      try {
        await fs.access(filePath);
        checks[key as keyof typeof checks] = true;
      } catch (error) {
        checks[key as keyof typeof checks] = false;
      }
    }

    // Check if Sentry is configured (either client or server config exists)
    // Note: sentryConfig is already set in the file checks above

    // Check privacy URL exists
    const privacyUrlExists = checks.privacyFile;

    // Check Android configuration
    const androidConfigOk = checks.androidManifest && checks.androidBuildGradle && checks.capacitorConfig;

    // Additional validation checks
    const additionalChecks = await performAdditionalChecks();

    const response: StoreReadinessResponse = {
      appId,
      appName,
      version,
      paymentsEnabled,
      envMode,
      privacyUrlExists,
      androidConfigOk,
      checks: {
        ...checks,
        // Remove individual sentry configs from response
        sentryConfig: checks.sentryConfig,
      },
      timestamp: new Date().toISOString(),
    };

    // Add additional checks to response
    const responseWithChecks = {
      ...response,
      additionalChecks,
      responseTime: Date.now() - startTime,
    };

    return NextResponse.json(responseWithChecks);

  } catch (error) {
    console.error('Health check failed:', error);
    
    // Return minimal response on error
    return NextResponse.json({
      appId: 'co.karyakarta.app',
      appName: 'Karyakarta',
      version: '1.0.0',
      paymentsEnabled: false,
      envMode: process.env.NODE_ENV || 'development',
      privacyUrlExists: false,
      androidConfigOk: false,
      checks: {
        privacyFile: false,
        androidManifest: false,
        androidBuildGradle: false,
        capacitorConfig: false,
        envFile: false,
        sentryConfig: false,
        networkUtility: false,
        errorBoundary: false,
      },
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { status: 500 });
  }
}

async function performAdditionalChecks() {
  const checks = {
    // Environment variables
    hasFirebaseConfig: !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ),
    hasSentryConfig: !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
    hasPaymentConfig: !!(
      process.env.RAZORPAY_KEY_ID_TEST &&
      process.env.RAZORPAY_KEY_SECRET_TEST &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_TEST
    ),
    hasReviewerConfig: !!process.env.NEXT_PUBLIC_REVIEWER_TOKEN,
    
    // File content validation
    androidManifestValid: false,
    capacitorConfigValid: false,
    packageJsonValid: false,
  };

  try {
    // Check Android manifest content
    const androidManifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    try {
      const manifestContent = await fs.readFile(androidManifestPath, 'utf-8');
      checks.androidManifestValid = manifestContent.includes('co.karyakarta.app') && 
                                   manifestContent.includes('uses-permission');
    } catch (error) {
      checks.androidManifestValid = false;
    }

    // Check Capacitor config content
    const capacitorConfigPath = path.join(process.cwd(), 'capacitor.config.ts');
    try {
      const capacitorContent = await fs.readFile(capacitorConfigPath, 'utf-8');
      checks.capacitorConfigValid = capacitorContent.includes('co.karyakarta.app') && 
                                   capacitorContent.includes('Karyakarta');
    } catch (error) {
      checks.capacitorConfigValid = false;
    }

    // Check package.json content
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      checks.packageJsonValid = !!(packageJson.name && packageJson.version);
    } catch (error) {
      checks.packageJsonValid = false;
    }

  } catch (error) {
    console.warn('Additional checks failed:', error);
  }

  return checks;
}
