import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  typescript: {
    skipTypeCheck: true,
  },
  paths: {
    prompts: false,
    resources: false,
  },
  tools: {
    // Re-enable the experimental tool (which has enabled: false in its metadata)
    enable: ["experimental"],

    // --- Try these alternative modes by swapping them in: ---
    //
    // Allowlist mode — only bundle the listed tools.
    // Listing a tool in `include` implicitly re-enables it even if its
    // metadata has `enabled: false`.
    // include: ["public-info", "user-profile", "multi-hop-report"],
    //
    // Denylist mode — bundle everything except the listed tools.
    // exclude: ["experimental"],
  },
};

export default config;
