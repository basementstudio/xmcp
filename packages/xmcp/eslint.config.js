// xmcp uses the shared flat config from packages/eslint-config-custom.
// CommonJS (`require`) is fine here because xmcp is `"type": "commonjs"`.
const sharedConfig = require("eslint-config-custom");

module.exports = [
  ...sharedConfig,
  {
    // Tests live outside src/ and follow vitest conventions; lint only the
    // shipped surface for now. Reactivate test linting once the patterns
    // are aligned.
    ignores: [
      "dist/**",
      "test/**",
      "bundler/**",
      "scripts/**",
      "*.config.ts",
      "*.config.js",
    ],
  },
];
