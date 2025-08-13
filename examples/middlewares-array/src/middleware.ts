import { apiKeyAuthMiddleware, type XmcpMiddleware } from "xmcp";

const middleware: XmcpMiddleware[] = [
  apiKeyAuthMiddleware({
    headerName: "x-api-key",
    apiKey: "12345",
  }),
  (_req, _res, next) => {
    console.log("Hello from middleware");
    next();
  },
];

export default middleware;
