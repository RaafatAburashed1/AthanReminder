import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.athanreminder.app',
  appName: 'Athan Reminder',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  // plugins: {
  //   LocalNotifications: {
  //     smallIcon: "ic_stat_icon_config_sample",
  //     iconColor: "#488AFF",
  //     // sound: "adhan_makkah.wav",
  //   },
  // },
};

export default config;
