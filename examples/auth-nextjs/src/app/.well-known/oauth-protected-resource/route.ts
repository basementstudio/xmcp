import {
  protectedResourceHandler,
  metadataCorsOptionsRequestHandler,
} from "@xmcp/adapter";

const handler = protectedResourceHandler({
  // Specify the Issuer URL of the associated Authorization Server
  authServerUrls: ["https://auth-server.com"],
});

export { handler as GET, metadataCorsOptionsRequestHandler as OPTIONS };
