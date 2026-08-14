import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hormiruta.app',
  appName: 'hormiruta',
  webDir: 'out',
  server: {
    url: 'https://hormiruta.vercel.app',
    errorPath: '/offline.html',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'accounts.google.com',
      'google.com',
      '*.google.com',
      'myaccount.google.com',
      'accounts.youtube.com',
      'gstatic.com',
      '*.gstatic.com',
      '*.googleusercontent.com',
      '*.googleapis.com',
      '*.vercel.app'
    ]
  },
  android: {
    webContentsDebuggingEnabled: true
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"]
    },
    LocalNotifications: {
      smallIcon: "ic_launcher",
      iconColor: "#3B82F6",
      sound: "beep.wav"
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#060914",
      androidScaleType: "CENTER",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false
    }
  }
};

export default config;
