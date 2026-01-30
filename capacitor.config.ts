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
      '*.googleusercontent.com',
      '*.vercel.app'
    ]
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"]
    }
  }
};

export default config;
