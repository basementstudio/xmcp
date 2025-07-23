import {
  authServerMetadataHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from "@clerk/mcp-tools/next";

const handler = authServerMetadataHandlerClerk();

export { handler as GET, metadataCorsOptionsRequestHandler as OPTIONS };
