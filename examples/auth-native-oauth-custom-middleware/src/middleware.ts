import { nativeOAuthMiddleware, type Middleware } from "xmcp";
import {
  customJwtMiddleware,
  PROVIDER_BASE_URL,
  RESOURCE_SERVER_BASE_URL,
} from "./utils/auth";

const middleware: Middleware[] = [
  nativeOAuthMiddleware({
    issuerUrl: PROVIDER_BASE_URL,
    baseUrl: RESOURCE_SERVER_BASE_URL,
    middleware: false,
  }),
  customJwtMiddleware,
];

export default middleware;
