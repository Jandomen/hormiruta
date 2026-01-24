import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hormiruta.app',
  appName: 'hormiruta',
  webDir: 'out',
  server: {
    url: 'https://hormiruta.vercel.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'accounts.google.com',
      '*.googleusercontent.com',
      '*.vercel.app'
    ]
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '440686775268-11p4igopbout2f5jqkor8d0jjhgjp8er.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
