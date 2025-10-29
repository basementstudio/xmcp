import {
  resourceMetadataHandler,
  resourceMetadataOptions,
} from "@xmcp/adapter";

const handler = resourceMetadataHandler({
  // Specify the Issuer URL of the associated Authorization Server
  authorizationServers: ["https://auth-server.com"],
});

export { handler as GET, resourceMetadataOptions as OPTIONS };
