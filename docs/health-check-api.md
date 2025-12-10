# Health Check API Documentation

## Endpoint: `/api/health/store-readiness`

### Overview
This endpoint provides comprehensive health checks for the Karyakarta app, validating configuration, file existence, and environment setup for store readiness.

### Request
```http
GET /api/health/store-readiness
```

### Response Format
```json
{
  "appId": "co.karyakarta.app",
  "appName": "Karyakarta",
  "version": "1.0.0",
  "paymentsEnabled": false,
  "envMode": "development",
  "privacyUrlExists": true,
  "androidConfigOk": true,
  "checks": {
    "privacyFile": true,
    "androidManifest": true,
    "androidBuildGradle": true,
    "capacitorConfig": true,
    "envFile": true,
    "sentryConfig": true,
    "networkUtility": true,
    "errorBoundary": true
  },
  "additionalChecks": {
    "hasFirebaseConfig": true,
    "hasSentryConfig": true,
    "hasPaymentConfig": false,
    "hasReviewerConfig": true,
    "androidManifestValid": true,
    "capacitorConfigValid": true,
    "packageJsonValid": true
  },
  "responseTime": 45,
  "timestamp": "2025-01-22T10:30:00.000Z"
}
```

### Response Fields

#### Core App Information
- **`appId`**: Application identifier (from env or default)
- **`appName`**: Application name (from package.json)
- **`version`**: Application version (from package.json)
- **`paymentsEnabled`**: Whether payments are enabled (from env)
- **`envMode`**: Environment mode (development/production)
- **`privacyUrlExists`**: Whether privacy.html file exists
- **`androidConfigOk`**: Whether Android configuration is complete

#### File Existence Checks
- **`privacyFile`**: `/public/privacy.html` exists
- **`androidManifest`**: Android manifest file exists
- **`androidBuildGradle`**: Android build.gradle exists
- **`capacitorConfig`**: Capacitor configuration exists
- **`envFile`**: `.env.local` file exists
- **`sentryConfig`**: Sentry configuration files exist
- **`networkUtility`**: Network utility files exist
- **`errorBoundary`**: Error boundary component exists

#### Additional Validation Checks
- **`hasFirebaseConfig`**: Firebase environment variables are set
- **`hasSentryConfig`**: Sentry DSN is configured
- **`hasPaymentConfig`**: Payment environment variables are set
- **`hasReviewerConfig`**: Reviewer token is configured
- **`androidManifestValid`**: Android manifest contains required content
- **`capacitorConfigValid`**: Capacitor config contains required content
- **`packageJsonValid`**: Package.json is valid and contains required fields

#### Metadata
- **`responseTime`**: API response time in milliseconds
- **`timestamp`**: ISO timestamp of the health check

### Usage Examples

#### Basic Health Check
```bash
curl http://localhost:3000/api/health/store-readiness
```

#### Check Specific Fields
```bash
curl http://localhost:3000/api/health/store-readiness | jq '.androidConfigOk'
curl http://localhost:3000/api/health/store-readiness | jq '.paymentsEnabled'
curl http://localhost:3000/api/health/store-readiness | jq '.checks.privacyFile'
```

#### Monitor Health Status
```bash
# Check if app is ready for store deployment
curl -s http://localhost:3000/api/health/store-readiness | jq '.androidConfigOk and .privacyUrlExists'

# Check if payments are properly configured
curl -s http://localhost:3000/api/health/store-readiness | jq '.paymentsEnabled and .additionalChecks.hasPaymentConfig'
```

### Store Readiness Criteria

The endpoint helps determine if the app is ready for store deployment by checking:

1. **Privacy Policy**: `privacyUrlExists` must be `true`
2. **Android Configuration**: `androidConfigOk` must be `true`
3. **Core Files**: All essential files must exist
4. **Environment**: Proper environment variables must be set
5. **Error Handling**: Error boundary and logging must be configured

### Error Handling

If the health check fails, the endpoint returns a 500 status with minimal information:

```json
{
  "appId": "co.karyakarta.app",
  "appName": "Karyakarta",
  "version": "1.0.0",
  "paymentsEnabled": false,
  "envMode": "development",
  "privacyUrlExists": false,
  "androidConfigOk": false,
  "checks": {
    "privacyFile": false,
    "androidManifest": false,
    "androidBuildGradle": false,
    "capacitorConfig": false,
    "envFile": false,
    "sentryConfig": false,
    "networkUtility": false,
    "errorBoundary": false
  },
  "timestamp": "2025-01-22T10:30:00.000Z",
  "error": "Health check failed"
}
```

### Integration with CI/CD

This endpoint can be used in CI/CD pipelines to validate app readiness:

```yaml
# GitHub Actions example
- name: Check Store Readiness
  run: |
    response=$(curl -s http://localhost:3000/api/health/store-readiness)
    android_ok=$(echo $response | jq '.androidConfigOk')
    privacy_ok=$(echo $response | jq '.privacyUrlExists')
    
    if [ "$android_ok" = "true" ] && [ "$privacy_ok" = "true" ]; then
      echo "✅ App is ready for store deployment"
    else
      echo "❌ App is not ready for store deployment"
      exit 1
    fi
```

### Monitoring

The endpoint can be used for monitoring and alerting:

```javascript
// Health check monitoring
async function checkAppHealth() {
  try {
    const response = await fetch('/api/health/store-readiness');
    const health = await response.json();
    
    if (!health.androidConfigOk) {
      console.warn('Android configuration is incomplete');
    }
    
    if (!health.privacyUrlExists) {
      console.warn('Privacy policy is missing');
    }
    
    if (health.paymentsEnabled && !health.additionalChecks.hasPaymentConfig) {
      console.warn('Payments enabled but payment config is missing');
    }
    
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}
```
