import { ExpoConfig } from "expo/config"
import pkg from "./package.json"

const config: ExpoConfig = {
  name: "Privatefolio",
  slug: "privatefolio",
  version: pkg.version,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "privatefolio",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "xyz.privatefolio.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon/foreground.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "89ec2400-448c-4ae5-ad75-bdddb2312ee8",
    },
  },
}

export default config
