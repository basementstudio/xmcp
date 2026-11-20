import { getRequestContext, type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "describe-caller",
  description: "Report the client identity sent with the current request",
  annotations: { readOnlyHint: true },
};

export default function describeCaller() {
  const { clientInfo, http } = getRequestContext();
  return {
    structuredContent: {
      client: clientInfo ?? null,
      requestId: http?.id ?? null,
    },
  };
}
