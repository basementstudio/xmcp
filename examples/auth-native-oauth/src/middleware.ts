import { nativeOAuthMiddleware } from "xmcp";

const PORT = 3004;
const PROVIDER_PORT = 4404;

export default nativeOAuthMiddleware({
  issuerUrl: `http://127.0.0.1:${PROVIDER_PORT}`,
  baseUrl: `http://127.0.0.1:${PORT}`,
});
