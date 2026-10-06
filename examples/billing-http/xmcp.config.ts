import type { XmcpConfig } from "xmcp";
export default {
  http: true,
  bundler: (config) => {
    // Rspack's builtin list predates node:sqlite. Load Node's implementation
    // at runtime instead of trying to bundle the experimental builtin.
    const existing = config.externals
      ? Array.isArray(config.externals)
        ? config.externals
        : [config.externals]
      : [];
    config.externals = [...existing, { "node:sqlite": "module node:sqlite" }];
    return config;
  },
  paths: { tools: "./src/tools", prompts: false, resources: false },
} satisfies XmcpConfig;
