const { getDefaultConfig } = require('expo/metro-config');

// Expo SDK 52 auto-configures watchFolders / nodeModulesPaths for monorepos.
// Do NOT set resolver.disableHierarchicalLookup: it breaks pnpm's symlinked layout.
const config = getDefaultConfig(__dirname);

module.exports = config;
