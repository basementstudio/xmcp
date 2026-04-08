import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";
import { TransportSendOptions } from "@modelcontextprotocol/sdk/shared/transport";
import express, {
  Express,
  Request,
  Response,
  NextFunction,
} from "express";
import http, { IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "node:crypto";
import { JsonRpcMessage, HttpTransportOptions } from "./base-streamable-http";
import homeTemplate from "../../templates/home";
import { greenCheck } from "../../../utils/cli-icons";
import { findAvailablePort } from "../../../utils/port-utils";
import { cors } from "./cors";
import { Provider } from "@/runtime/middlewares/utils";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";
import {
  extractToolNamesFromRequest,
  storeToolNamesOnRequestHeaders,
} from "@/runtime/utils/request-tool-names";
import { CorsConfig, corsConfigSchema } from "@/compiler/config/schemas";

// Global type declarations for tool name context
declare global {
  var __XMCP_CURRENT_TOOL_NAME: string | string[] | undefined;
}

// no session management
export class StatelessHttpServerTransport {
  debug: boolean;
  bodySizeLimit: string;
  private transport: StreamableHTTPServerTransport;

  constructor(debug: boolean, bodySizeLimit: string) {
    this.debug = debug;
    this.bodySizeLimit = bodySizeLimit;
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
  }

  set onmessage(handler: ((message: JsonRpcMessage, extra?: any) => void) | undefined) {
    this.transport.onmessage = handler as any;
  }

  get onmessage() {
    return this.transport.onmessage as
      | ((message: JsonRpcMessage, extra?: any) => void)
      | undefined;
  }

  set onerror(handler: ((error: Error) => void) | undefined) {
    this.transport.onerror = handler;
  }

  get onerror() {
    return this.transport.onerror;
  }

  set onclose(handler: (() => void) | undefined) {
    this.transport.onclose = handler;
  }

  get onclose() {
    return this.transport.onclose;
  }

  async start(): Promise<void> {
    await this.transport.start();
  }

  async close(): Promise<void> {
    await this.transport.close();
  }

  async send(
    message: JsonRpcMessage,
    options?: TransportSendOptions
  ): Promise<void> {
    await this.transport.send(message as any, options);
  }

  async handleRequest(
    req: IncomingMessage & { auth?: AuthInfo },
    res: ServerResponse,
    parsedBody?: unknown
  ): Promise<void> {
    await this.transport.handleRequest(req, res, parsedBody);
  }
}

// Stateless HTTP Transport wrapper
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
  private sessions: Map<
    string,
    {
      server: McpServer;
      transport: StreamableHTTPServerTransport;
    }
  > = new Map();

  constructor(
    createServerFn: () => Promise<McpServer>,
    options: HttpTransportOptions = {},
    corsConfig: CorsConfig = corsConfigSchema.parse({}),
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
        mode: "stateful",
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

      await this.handleSessionRequest(req, res);
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

  private getSessionId(req: Request): string | undefined {
    const sessionHeader = req.headers["mcp-session-id"];

    if (Array.isArray(sessionHeader)) {
      return sessionHeader[0];
    }

    return sessionHeader;
  }

  private isInitializeRequest(body: unknown): boolean {
    const messages = Array.isArray(body) ? body : [body];

    return messages.some(
      (message) =>
        !!message &&
        typeof message === "object" &&
        (message as { method?: unknown }).method === "initialize"
    );
  }

  private async createSessionEntry() {
    const server = await this.createServerFn();
    let transport!: StreamableHTTPServerTransport;

    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        this.sessions.set(sessionId, { server, transport });
      },
    });

    transport.onclose = () => {
      const sessionId = transport.sessionId;

      if (sessionId) {
        this.sessions.delete(sessionId);
      }

      void server.close();
    };

    await server.connect(transport);

    return { server, transport };
  }

  private attachRequestCleanup(res: Response): void {
    const clearToolContext = () => {
      global.__XMCP_CURRENT_TOOL_NAME = undefined;
    };

    res.on("close", clearToolContext);
    res.on("finish", clearToolContext);
  }

  private async handleSessionRequest(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.attachRequestCleanup(res);

      const sessionId = this.getSessionId(req);

      if (sessionId) {
        const entry = this.sessions.get(sessionId);

        if (!entry) {
          res.status(404).json({
            jsonrpc: "2.0",
            error: {
              code: -32001,
              message: "Session not found",
            },
            id: null,
          });
          return;
        }

        await entry.transport.handleRequest(req, res, req.body);
        return;
      }

      if (req.method === "GET") {
        res.status(405).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Method not allowed.",
          },
          id: null,
        });
        return;
      }

      if (req.method === "POST" && this.isInitializeRequest(req.body)) {
        const entry = await this.createSessionEntry();
        await entry.transport.handleRequest(req, res, req.body);
        return;
      }

      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
    } catch (error) {
      console.error("[HTTP-server] Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
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
    for (const { server, transport } of this.sessions.values()) {
      void transport.close();
      void server.close();
    }
    this.sessions.clear();
    this.server.close();
    process.exit(0);
  }
}
