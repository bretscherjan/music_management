import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.musicmanagement.app',
  appName: 'Music Management Admin',
  webDir: 'dist',
  server: {
    // Use https scheme on Android for secure cookie handling
    androidScheme: 'https',
    url: 'https://music-management.ch', // Die URL, unter der dein Frontend erreichbar ist
    cleartext: true
  },
};

export default config;
