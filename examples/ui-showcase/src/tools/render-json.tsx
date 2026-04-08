import { createRenderJsonTool } from "@xmcp-dev/ui";

const renderJsonTool = createRenderJsonTool({
  transportMode: "host",
});

export const metadata = renderJsonTool.metadata;
export const schema = renderJsonTool.schema;
export default renderJsonTool.handler;
