import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.richiepa.copayapp',
  appName: 'CoPayApp',
  webDir: 'dist',

  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;