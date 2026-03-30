import { createServer } from "../../utils/server";
import { StatelessStreamableHTTPTransport } from "./stateless-streamable-http";
import { Middleware } from "@/types/middleware";
import {
  CorsConfig,
  ResolvedHttpConfig,
  TemplateConfig,
} from "@/compiler/config";
import { Provider, processProviders } from "@/runtime/middlewares/utils";
import { httpTransportContextProvider } from "@/runtime/contexts/http-transport-context";
import dotenv from "dotenv";
dotenv.config();

// by the time this is run, the config is already parsed and injected as object
// the injection handles the boolean case

const httpConfig = HTTP_CONFIG as ResolvedHttpConfig;
const corsConfig = HTTP_CORS_CONFIG as CorsConfig;
const templateConfig = TEMPLATE_CONFIG as TemplateConfig;

// middleware
const middleware = INJECTED_MIDDLEWARE as () =>
  | Promise<{
      default: Middleware | Middleware[];
    }>
  | undefined;

async function main() {
  const options = {
    port: httpConfig?.port,
    host: httpConfig?.host,
    debug: httpConfig?.debug,
    bodySizeLimit: httpConfig?.bodySizeLimit?.toString(),
    endpoint: httpConfig?.endpoint,
    template: templateConfig,
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

  httpTransportContextProvider(
    {
      config: {
        http: httpConfig,
      },
    },
    async () => {
      const transport = new StatelessStreamableHTTPTransport(
        createServer,
        options,
        corsOptions,
        providers
      );

      await transport.start();
    }
  );
}

main();
