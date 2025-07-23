import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandlerClerk,
} from "@clerk/mcp-tools/next";

const handler = protectedResourceHandlerClerk({
  scopes_supported: ["profile", "email"],
});

export { handler as GET, metadataCorsOptionsRequestHandler as OPTIONS };
