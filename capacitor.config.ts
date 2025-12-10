import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.karyakarta.app',
  appName: 'Karyakarta',
  webDir: 'out',
  // Example for hosted deployments (uncomment and point to your prod URL).
  // Switch back to local dev by re-commenting and relying on the bundled assets.
  // server: {
  //   url: 'https://your-hosted-domain.com',
  //   cleartext: false
  // },
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#2563eb',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
