import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.saan.opersystem',
  appName: 'SAAN OPER SYSTEM',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
