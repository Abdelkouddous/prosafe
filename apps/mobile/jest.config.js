// Jest config for the mobile app (iOS project of jest-expo; Platform is mocked per-test when needed).
// The app has no babel.config.js, so babel-preset-expo is applied explicitly for the transform.
const path = require("path");
const expoDir = path.dirname(require.resolve("expo/package.json"));
const babelPresetExpo = require.resolve("babel-preset-expo", { paths: [expoDir] });

module.exports = {
  preset: "jest-expo/ios",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  transform: {
    "\\.[jt]sx?$": ["babel-jest", { presets: [babelPresetExpo], caller: { name: "metro", bundler: "metro", platform: "ios" } }],
  },
  // pnpm nests packages under node_modules/.pnpm/<pkg>/node_modules/<pkg>
  transformIgnorePatterns: [
    "/node_modules/(?!(\\.pnpm/)?(((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
};
