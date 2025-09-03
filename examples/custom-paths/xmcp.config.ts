import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    port: 3002,
  },
  // when we modify either of the values we need to also set to true/false the ones we don't change
  paths: {
    tools: "src/my-tools/",
    prompts: false, // prompts are set to false cause we don't have that directory
  },
};

export default config;
