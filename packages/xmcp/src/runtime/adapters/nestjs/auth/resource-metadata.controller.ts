import { Controller, Get, Options, Req, Res, Inject, Optional } from "@nestjs/common";
import { Request, Response } from "express";

/**
 * OAuth Protected Resource Metadata interface (RFC 9728).
 */
export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
  introspection_endpoint?: string;
  revocation_endpoint?: string;
  [key: string]: unknown;
}

/**
 * Injection token for authorization servers configuration
 */
export const AUTHORIZATION_SERVERS = "XMCP_AUTHORIZATION_SERVERS";

/**
 * CORS headers for OAuth Protected Resource Metadata endpoint.
 * Configured to allow any origin to make the endpoint accessible to web-based MCP clients.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

/**
 * OAuth 2.0 Protected Resource Metadata endpoint controller (RFC 9728).
 * Serves protected resource metadata at `/.well-known/oauth-protected-resource`.
 *
 * To use this controller, add it to your module and provide the authorization servers:
 *
 * @example
 * ```typescript
 * import { Module } from "@nestjs/common";
 * import {
 *   XmcpModule,
 *   ResourceMetadataController,
 *   AUTHORIZATION_SERVERS
 * } from ".xmcp/adapter";
 *
 * @Module({
 *   imports: [XmcpModule],
 *   controllers: [ResourceMetadataController],
 *   providers: [
 *     {
 *       provide: AUTHORIZATION_SERVERS,
 *       useValue: ["https://auth.example.com"],
 *     },
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Controller(".well-known/oauth-protected-resource")
export class ResourceMetadataController {
  constructor(
    @Optional()
    @Inject(AUTHORIZATION_SERVERS)
    private authorizationServers: string[] = []
  ) {}

  /**
   * GET handler for OAuth Protected Resource Metadata.
   * Returns metadata including the resource URL and authorization servers.
   */
  @Get()
  getMetadata(@Req() req: Request, @Res() res: Response): void {
    const resource = this.extractResourceUrl(req);

    const metadata: OAuthProtectedResourceMetadata = {
      resource,
      authorization_servers: this.authorizationServers,
    };

    // Set CORS and cache headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader("Cache-Control", "max-age=3600");
    res.setHeader("Content-Type", "application/json");

    res.json(metadata);
  }

  /**
   * OPTIONS handler for CORS preflight requests.
   * Necessary for MCP clients that operate in web browsers.
   */
  @Options()
  handleOptions(@Res() res: Response): void {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.status(200).send();
  }

  /**
   * Extracts the base resource URL from the request
   */
  private extractResourceUrl(req: Request): string {
    const protocol = req.protocol;
    const host = req.get("host");
    return `${protocol}://${host}`;
  }
}
