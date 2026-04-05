import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ch.musigelgg.app',
  appName: 'Musig Elgg Admin',
  webDir: 'dist',
  server: {
    // Use https scheme on Android for secure cookie handling
    androidScheme: 'https',
    url: 'https://musig-elgg.ch', // Die URL, unter der dein Frontend erreichbar ist
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      // Which notification types to show while app is in foreground
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
