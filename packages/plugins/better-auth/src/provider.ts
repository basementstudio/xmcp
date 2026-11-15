import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { betterAuth } from "better-auth";
import {
  NextFunction,
  Router,
  type RequestHandler,
  Request,
  Response,
} from "express";
import { jwt } from "better-auth/plugins";
import { mcp, requireMcpAuth } from "@better-auth/mcp";
import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import path from "path";
import express from "express";
import { betterAuthContextProvider, setBetterAuthContext } from "./context.js";
import { fileURLToPath } from "url";
import { Middleware } from "xmcp";
import { BetterAuthConfig, BetterAuthSession } from "./types.js";
import { processProvidersResponse } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authUiPath = path.join(__dirname, "auth-ui");

type AccessTokenClaims = Parameters<Parameters<typeof requireMcpAuth>[1]>[1];

function getMcpResource(auth: BetterAuthConfig): string {
  return new URL("/mcp", auth.baseURL).href;
}

function getBetterAuthInstance(auth: BetterAuthConfig): any {
  const betterAuthInstance = betterAuth({
    database: auth.database,
    baseURL: auth.baseURL,
    secret: auth.secret,
    disabledPaths: ["/token"],
    ...(auth.providers?.emailAndPassword?.enabled && {
      emailAndPassword: auth.providers.emailAndPassword,
    }),
    ...(auth.providers?.google && {
      socialProviders: {
        google: {
          clientId: auth.providers.google.clientId,
          clientSecret: auth.providers.google.clientSecret,
          redirectURI: `${auth.baseURL}/auth/callback/google`,
        },
      },
    }),
    plugins: [
      jwt({ disableSettingJwtHeader: true }),
      mcp({
        loginPage: "/auth/sign-in",
        consentPage: "/auth/consent",
        resource: getMcpResource(auth),
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultApplicationType: "infer",
      }),
    ],
  });

  return betterAuthInstance;
}

export type BetterAuthInstanceWithMcp = ReturnType<
  typeof getBetterAuthInstance
>;

export function betterAuthProvider(auth: BetterAuthConfig): Middleware {
  const betterAuthInstance = getBetterAuthInstance(auth);

  return {
    middleware: betterAuthMiddleware(betterAuthInstance, auth),
    router: betterAuthRouter(betterAuthInstance, auth),
  };
}

export function betterAuthRouter(
  betterAuthInstance: BetterAuthInstanceWithMcp,
  authConfig: BetterAuthConfig
): Router {
  const router = Router();

  router.use((req: Request, _res: Response, next: NextFunction) => {
    betterAuthContextProvider(
      {
        api: betterAuthInstance,
        headers: req.headers,
      },
      () => {
        next();
      }
    );
  });

  // get config to render sign in page
  router.get("/auth/config", (_req, res) => {
    const config = processProvidersResponse(authConfig.providers);

    if (
      !config.providers.emailAndPassword?.enabled &&
      !config.providers.google?.enabled
    ) {
      res.status(500).json({ error: "No providers configured" });
      return;
    }

    res.json(config);
  });

  router.all("/api/auth/{*any}", toNodeHandler(betterAuthInstance));

  // serve index.html for auth routes in development so react router can handle them
  const serveAuthHtml = (_req: Request, res: Response) => {
    res.sendFile("index.html", { root: authUiPath });
  };

  router.get("/auth/sign-in", serveAuthHtml);
  router.get("/auth/consent", serveAuthHtml);

  // email callback to handle verify email redirect
  /*   if (authConfig.providers?.emailAndPassword) {
    router.get("/auth/callback/email", serveAuthHtml);
  }
 */
  // google callback custom to handle redirect
  if (authConfig.providers?.google) {
    router.get("/auth/callback/google", serveAuthHtml);
  }

  router.get(
    [
      "/.well-known/oauth-authorization-server",
      "/.well-known/oauth-authorization-server/api/auth",
    ],
    toNodeHandler(oauthProviderAuthServerMetadata(betterAuthInstance))
  );

  router.get(
    [
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/mcp",
    ],
    toNodeHandler(betterAuthInstance)
  );

  // serve auth ui static assets AFTER specific routes
  router.use("/auth", express.static(authUiPath));

  return router;
}

export function betterAuthMiddleware(
  betterAuthInstance: BetterAuthInstanceWithMcp,
  authConfig: BetterAuthConfig
): RequestHandler {
  const resource = getMcpResource(authConfig);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith("/mcp")) {
      next();
      return;
    }

    const request = new globalThis.Request(
      new URL(req.originalUrl, authConfig.baseURL),
      { method: req.method, headers: fromNodeHeaders(req.headers) }
    );

    let session: BetterAuthSession | undefined;

    const verifyMcpRequest = requireMcpAuth(
      betterAuthInstance,
      async (verifiedRequest, accessTokenClaims) => {
        session = toBetterAuthSession(verifiedRequest, accessTokenClaims);
        return new globalThis.Response(null, { status: 204 });
      },
      { resource }
    );

    try {
      const challenge = await verifyMcpRequest(request);

      if (session) {
        setBetterAuthContext({ session });
        next();
        return;
      }

      res.status(challenge.status);
      challenge.headers.forEach((value, key) => res.setHeader(key, value));
      res.send(await challenge.text());
    } catch {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Failed to verify the MCP access token",
        },
        id: null,
      });
    }
  };
}

function toBetterAuthSession(
  request: globalThis.Request,
  claims: AccessTokenClaims
): BetterAuthSession {
  const authorization = request.headers.get("authorization") ?? "";

  return {
    accessToken: authorization.replace(/^(Bearer|DPoP)\s+/i, ""),
    accessTokenExpiresAt: new Date((claims.exp ?? 0) * 1000),
    clientId: String(claims.azp),
    userId: claims.sub ?? "",
    scopes: typeof claims.scope === "string" ? claims.scope : "",
  };
}
