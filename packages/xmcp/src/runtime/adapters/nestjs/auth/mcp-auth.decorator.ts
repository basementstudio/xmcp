import { applyDecorators, UseGuards } from "@nestjs/common";
import { XmcpAuthGuard } from "./auth.guard";
import { XmcpAuth, AuthConfig } from "./auth.decorator";

/**
 * Combined decorator that applies both the XmcpAuthGuard and XmcpAuth configuration.
 * This provides a cleaner API compared to using @UseGuards and @XmcpAuth separately.
 *
 * @example
 * Before (verbose):
 * ```typescript
 * @UseGuards(XmcpAuthGuard)
 * @XmcpAuth({ verifyToken, required: true })
 * async handleMcp(@Req() req, @Res() res) { ... }
 * ```
 *
 * After (single decorator):
 * ```typescript
 * @McpAuth({ verifyToken, required: true })
 * async handleMcp(@Req() req, @Res() res) { ... }
 * ```
 *
 * @param config - Authentication configuration
 * @returns Combined decorator that applies guard and configuration
 */
export const McpAuth = (config: AuthConfig) =>
  applyDecorators(UseGuards(XmcpAuthGuard), XmcpAuth(config));
