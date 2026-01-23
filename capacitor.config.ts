import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hormiruta.app',
  appName: 'hormiruta',
  webDir: 'out',
  server: {

    url: 'https://hormiruta.vercel.app',
    cleartext: true
  }
};

export default config;
