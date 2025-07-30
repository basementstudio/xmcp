import { createServer } from "../../utils/server";
import { StatelessStreamableHTTPTransport } from "./stateless-streamable-http";
import { OAuthConfigOptions } from "../../../auth/oauth/types";
import { XmcpMiddleware } from "@/types/middleware";
import { CorsConfig } from "@/compiler/config/schemas";
import { Provider, processProviders } from "@/auth";

// by the time this is run, the config is already parsed and injected as object
// the injection handles the boolean case
// perhaps this should be an exported type from the compiler config
type RuntimeHttpConfig = {
  port?: number;
  host?: string;
  bodySizeLimit?: number;
  debug?: boolean;
  endpoint?: string;
  stateless?: boolean; // stateless right now is the only option supported
};

// @ts-expect-error: injected by compiler
const httpConfig = HTTP_CONFIG as RuntimeHttpConfig;
// @ts-expect-error: injected by compiler
const corsConfig = HTTP_CORS_CONFIG as CorsConfig;

// middleware
// @ts-expect-error: injected by compiler
const middleware = INJECTED_MIDDLEWARE as () =>
  | Promise<{
      default: XmcpMiddleware[];
    }>
  | undefined;

// oauth config
// @ts-expect-error: injected by compiler
const oauthConfig = OAUTH_CONFIG as OAuthConfigOptions | undefined;

async function main() {
  const options = {
    port: httpConfig?.port,
    host: httpConfig?.host,
    debug: httpConfig?.debug,
    bodySizeLimit: httpConfig?.bodySizeLimit?.toString(),
    endpoint: httpConfig?.endpoint,
  };

  const corsOptions = {
    origin: corsConfig.origin,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    exposedHeaders: corsConfig.exposedHeaders,
    credentials: corsConfig.credentials,
    maxAge: corsConfig.maxAge,
  };

  let providers: Provider[] = [];

  // process the middleware file content splitting into providers (middlewares and/or routers) preserving sequence
  if (middleware) {
    const middlewareModule = await middleware();
    if (middlewareModule && middlewareModule.default) {
      const defaultExport = middlewareModule.default;

      providers = processProviders(defaultExport);
    }
  }

  const transport = new StatelessStreamableHTTPTransport(
    createServer,
    options,
    corsOptions,
    oauthConfig,
    providers
  );
  await transport.start();
}

main();
