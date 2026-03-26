import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
  typescript: {
    skipTypeCheck: true,
  },
  bundler: (config) => {
    // isolated-vm is a native C++ binary — can't be bundled by Rspack.
    // Mark it as external so it's loaded via require() at runtime.
    const existing =
      typeof config.externals === "object" && !Array.isArray(config.externals)
        ? config.externals
        : {};
    config.externals = {
      ...existing,
      "isolated-vm": "isolated-vm",
    };
    return config;
  },
};

export default config;
