import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { AuthInfo } from "./auth.decorator";

/**
 * Parameter decorator to extract the authenticated user's AuthInfo from the request.
 * The AuthInfo is populated by the XmcpAuthGuard after successful token verification.
 *
 * @example
 * ```typescript
 * import { Auth, AuthInfo, McpAuth, XmcpService } from "@xmcp/adapter";
 *
 * @Controller('mcp')
 * export class McpController {
 *   constructor(private readonly xmcpService: XmcpService) {}
 *
 *   @Post()
 *   @McpAuth({ verifyToken, required: true })
 *   async handleMcp(
 *     @Auth() auth: AuthInfo,
 *     @Req() req: Request,
 *     @Res() res: Response
 *   ): Promise<void> {
 *     console.log('Client ID:', auth?.clientId);
 *     console.log('Scopes:', auth?.scopes);
 *     return this.xmcpService.handleRequest(req, res);
 *   }
 * }
 * ```
 */
export const Auth = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthInfo | undefined => {
    const request = ctx.switchToHttp().getRequest<Request & { auth?: AuthInfo }>();
    return request.auth;
  }
);
