import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jitcall.app',
  appName: 'jitcall Notification',
  webDir: 'www',

  plugins: {
    "PushNotifications": {
      "presentationOptions": ['alert', 'badge', 'sound'],
    },
  }
};

export default config;
