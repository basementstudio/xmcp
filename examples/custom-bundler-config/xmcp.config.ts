import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3002,
  },
  /** 
   * Custom bundler configuration
   * @param config - The Rspack configuration
   * @returns The Rspack configuration
   */
  bundler: (config) => {
    // Add raw loader for images to get them as base64
    config.module?.rules?.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      type: "asset/inline",
    });

    return config;
  },
};

export default config;
