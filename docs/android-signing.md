# Android App Signing Configuration

This document explains how to set up Android app signing for release builds.

## Overview

The app is configured to use conditional signing:
- **Debug builds**: Use default debug keystore (automatic)
- **Release builds**: Use custom keystore if available, otherwise fall back to debug signing

## Setup Instructions

### 1. Create Keystore Properties File

Copy the template and fill in your values:

```bash
cp android/keystore.properties.template android/keystore.properties
```

Edit `android/keystore.properties`:

```properties
storeFile=release.keystore
storePassword=your_actual_store_password
keyAlias=your_actual_key_alias
keyPassword=your_actual_key_password
```

### 2. Generate Release Keystore

If you don't have a keystore yet, generate one:

```bash
keytool -genkey -v -keystore android/release.keystore -alias your_key_alias -keyalg RSA -keysize 2048 -validity 10000
```

### 3. Place Keystore File

Place your `release.keystore` file in the `android/` directory:

```
android/
├── release.keystore          # Your keystore file
├── keystore.properties       # Your credentials (DO NOT COMMIT)
└── keystore.properties.template  # Template (safe to commit)
```

## CI/CD Setup

For automated builds, set these environment variables:

```bash
export STORE_PASSWORD="your_store_password"
export KEY_ALIAS="your_key_alias" 
export KEY_PASSWORD="your_key_password"
```

Then use the template format in `keystore.properties`:

```properties
storeFile=release.keystore
storePassword=${STORE_PASSWORD}
keyAlias=${KEY_ALIAS}
keyPassword=${KEY_PASSWORD}
```

## Security Notes

⚠️ **IMPORTANT**: Never commit these files to version control:
- `android/keystore.properties`
- `android/*.keystore`
- `android/release.keystore`

These are already excluded in `.gitignore`.

## Build Commands

### Debug Build (uses debug signing)
```bash
./gradlew assembleDebug
```

### Release Build (uses release signing if keystore available)
```bash
./gradlew assembleRelease
```

## Verification

Check if signing is working:

```bash
# Check if keystore properties are loaded
./gradlew assembleRelease --info | grep -i keystore

# Verify APK signature
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### "Keystore not found" error
- Ensure `release.keystore` is in `android/` directory
- Check file permissions
- Verify keystore file is not corrupted

### "Invalid keystore format" error
- Regenerate keystore with correct format
- Ensure keystore is not password-protected at file level

### "Key alias not found" error
- Verify `keyAlias` in `keystore.properties` matches keystore
- List aliases: `keytool -list -keystore android/release.keystore`

## Backup

**CRITICAL**: Always backup your keystore and credentials:
- Store keystore file securely
- Document all passwords and aliases
- Test restore process before deleting originals

Losing your keystore means you cannot update your app on Google Play Store!
