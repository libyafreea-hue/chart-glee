import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aymann.cryptogemhunter",
  appName: "Crypto Gem Hunter",
  webDir: "dist/client",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId:
        "92917135869-np2emnpamvdr4c9t8i2i8415fd56fpml.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
