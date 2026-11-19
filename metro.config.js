// Metro config. Only needed so expo-sqlite can run in the browser (`npx expo start --web`).
// See https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/#web-setup
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web is SQLite compiled to WebAssembly.
config.resolver.assetExts.push('wasm');

// SQLite on web needs SharedArrayBuffer, which browsers only allow with these headers.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
