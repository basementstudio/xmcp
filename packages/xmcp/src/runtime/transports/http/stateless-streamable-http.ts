import {
  McpServer,
  createMcpHandler,
  McpHttpHandler,
} from "@modelcontextprotocol/server";
import {
  toNodeHandler,
  NodeMcpRequestHandler,
} from "@modelcontextprotocol/node";
import express, { Express, Request, Response, NextFunction } from "express";
import http from "http";
import { randomUUID } from "node:crypto";
import { HttpTransportOptions } from "./base-streamable-http";
import homeTemplate from "../../templates/home";
import { greenCheck } from "@/runtime/utils/terminal";
import { findAvailablePort } from "@/runtime/utils/port-utils";
import { cors } from "./cors";
import { Provider } from "@/runtime/middlewares/utils";
import {
  httpRequestContextProvider,
  setHttpRequestContext,
} from "@/runtime/contexts/http-request-context";
import {
  extractToolNamesFromRequest,
  storeToolNamesOnRequestHeaders,
} from "@/runtime/utils/request-tool-names";
import type { CorsConfig } from "@/config/schemas";
import { DEFAULT_CORS_CONFIG } from "./cors/defaults";
import { extractClientInfoFromMessages } from "@/runtime/utils/client-info";

// Global type declarations for tool name context
declare global {
  var __XMCP_CURRENT_TOOL_NAME: string | string[] | undefined;
}

// Stateless HTTP Transport wrapper. Protocol handling is delegated to the MCP
// SDK's createMcpHandler, which serves 2026-07-28 requests natively and
// answers 2025-era traffic through its stateless fallback (a fresh server per
// request; no session state survives between requests).
export class StatelessStreamableHTTPTransport {
  private app: Express;
  private server: http.Server;
  private port: number;
  private endpoint: string;
  private debug: boolean;
  private options: HttpTransportOptions;
  private createServerFn: () => Promise<McpServer>;
  private corsConfig: CorsConfig;
  private providers: Provider[] | undefined;
  private mcpHandler: McpHttpHandler;
  private nodeMcpHandler: NodeMcpRequestHandler;

  constructor(
    createServerFn: () => Promise<McpServer>,
    options: HttpTransportOptions = {},
    corsConfig: CorsConfig = DEFAULT_CORS_CONFIG,
    providers?: Provider[]
  ) {
    this.options = {
      ...options,
    };
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = options.port ?? parseInt(process.env.PORT || "3001", 10);
    this.endpoint = options.endpoint ?? "/mcp";
    this.debug = options.debug ?? false;
    this.createServerFn = createServerFn;
    this.corsConfig = corsConfig;
    this.providers = providers;

    this.mcpHandler = createMcpHandler(() => this.createServerFn(), {
      legacy: "stateless",
      onerror: (error) => this.log("MCP handler error:", error),
    });
    this.nodeMcpHandler = toNodeHandler(this.mcpHandler, {
      onerror: (error) =>
        console.error("[HTTP-server] Error handling MCP request:", error),
    });

    // Setup JSON parsing middleware FIRST
    this.app.use(express.json({ limit: this.options.bodySizeLimit || "10mb" }));

    this.setupInitialRoutes();
    this.setupInitialMiddleware();

    this.setupProviders();

    this.setupEndpointRoute();
  }

  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[StatelessHTTP] ${message}`, ...args);
    }
  }

  private setupProviders(): void {
    if (this.providers) {
      for (const provider of this.providers) {
        if (provider.router) {
          this.app.use(provider.router);
        }

        if (provider.middleware) {
          this.app.use(provider.middleware);
        }
      }
    }
  }

  private setupInitialMiddleware(): void {
    this.app.use(cors(this.corsConfig));

    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      this.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupInitialRoutes(): void {
    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "ok",
        transport: "streamable-http",
        mode: "stateless",
      });
    });

    this.app.get("/", (_req: Request, res: Response) => {
      const customHomePage = this.options.template?.homePage;

      if (customHomePage) {
        res.send(customHomePage);
        return;
      }

      res.send(
        homeTemplate(
          this.endpoint,
          this.options.template?.name,
          this.options.template?.description
        )
      );
    });

    this.setupMcpServerCardRoute();
    this.setupOpenAIAppsChallengeRoute();

    // isolate requests context
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      const id = randomUUID();
      httpRequestContextProvider({ id, headers: req.headers }, () => {
        next();
      });
    });
  }

  /**
   * Serves an MCP Server Card at /.well-known/mcp/server-card.json.
   * Enables agent discovery clients to auto-configure connections to this server.
   */
  private setupMcpServerCardRoute(): void {
    this.app.get(
      "/.well-known/mcp/server-card.json",
      (req: Request, res: Response) => {
        const host = req.get("host") ?? "localhost";
        const hostname = host.replace(/:\d+$/, "");
        const reversedName = hostname.split(".").reverse().join(".");
        const proto =
          (req.headers["x-forwarded-proto"] as string | undefined)
            ?.split(",")[0]
            ?.trim() ?? req.protocol;
        const card: Record<string, unknown> = {
          $schema:
            "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
          name: `${reversedName}/mcp`,
          version: SERVER_INFO.version,
          description: this.options.template?.description,
          title: this.options.template?.name,
          remotes: [
            {
              type: "streamable-http",
              url: `${proto}://${host}${this.endpoint}`,
            },
          ],
        };
        if (this.options.template?.icons?.length) {
          card.icons = this.options.template.icons;
        }
        res
          .setHeader("Content-Type", "application/mcp-server-card+json")
          .setHeader("Cache-Control", "public, max-age=3600, must-revalidate")
          .setHeader("Access-Control-Allow-Origin", "*")
          .json(card);
      }
    );
  }

  /**
   * Exposes the OpenAI Apps verification challenge file when configured.
   * The presence of OPENAI_APPS_VERIFICATION_TOKEN acts as the feature flag
   */
  private setupOpenAIAppsChallengeRoute(): void {
    const token = process.env.OPENAI_APPS_VERIFICATION_TOKEN;

    if (!token) {
      if (this.debug) {
        this.log(
          "OpenAI Apps verification token not configured; skipping challenge route"
        );
      }
      return;
    }

    this.app.get(
      "/.well-known/openai-apps-challenge",
      (_req: Request, res: Response) => {
        res.status(200).set("Content-Type", "text/plain").send(token);
      }
    );
  }

  private setupEndpointRoute(): void {
    this.app.use(this.endpoint, async (req: Request, res: Response) => {
      this.log(`${req.method} ${req.path}`);

      this.extractAndStoreToolName(req);

      await this.handleStatelessRequest(req, res);
    });
  }

  private extractAndStoreToolName(req: Request): void {
    try {
      const toolNames = extractToolNamesFromRequest(req);

      if (toolNames.length > 0) {
        storeToolNamesOnRequestHeaders(req, toolNames);
        global.__XMCP_CURRENT_TOOL_NAME = toolNames[0];
      }
    } catch (error) {
      // no op
    }
  }

  private async handleStatelessRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    const requestClientInfo = extractClientInfoFromMessages(req.body);

    res.on("finish", () => {
      global.__XMCP_CURRENT_TOOL_NAME = undefined;
    });
    res.on("close", () => {
      global.__XMCP_CURRENT_TOOL_NAME = undefined;
    });

    setHttpRequestContext({ clientInfo: requestClientInfo });

    // express.json() already drained the stream; hand the parsed body through
    await this.nodeMcpHandler(req, res, req.body);
  }

  public async start(): Promise<void> {
    const host = this.options.host || "127.0.0.1";
    const port = await findAvailablePort(this.port, host);

    this.server.listen(port, host, () => {
      console.log(
        `${greenCheck} MCP Server running on http://${host}:${port}${this.endpoint}`
      );

      this.setupShutdownHandlers();
    });
  }

  private setupShutdownHandlers(): void {
    process.on("SIGINT", this.shutdown.bind(this));
    process.on("SIGTERM", this.shutdown.bind(this));
  }

  public shutdown(): void {
    this.log("Shutting down server");
    void this.mcpHandler.close();
    this.server.close();
    process.exit(0);
  }
}
