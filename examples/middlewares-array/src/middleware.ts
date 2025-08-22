import { apiKeyAuthMiddleware, type Middleware } from "xmcp";

const middleware: Middleware[] = [
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
