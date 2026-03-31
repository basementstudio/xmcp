import { executeTool } from "@xmcp-dev/sandbox";

const execute = executeTool({
  url: process.env.API_BASE_URL || "https://petstore3.swagger.io/api/v3",
  env: ["API_KEY"],
  networkPolicy: { allow: ["petstore3.swagger.io"] },
});

export const schema = execute.schema;
export const metadata = execute.metadata;
export default execute.handler;
