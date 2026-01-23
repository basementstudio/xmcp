import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

/**
 * Create xmcp module folder with controller, module, and filter
 * for NestJS projects
 * @param projectRoot - Project root directory
 */
export function createNestJsModule(projectRoot: string): void {
  // Check if src folder exists - NestJS projects typically have src/
  const hasSrcFolder = fs.existsSync(path.join(projectRoot, "src"));
  const xmcpPath = hasSrcFolder ? "src/xmcp" : "xmcp";
  const xmcpDirPath = path.join(projectRoot, xmcpPath);

  try {
    // Create xmcp folder
    fs.ensureDirSync(xmcpDirPath);

    // Create xmcp.filter.ts
    const filterFilePath = path.join(xmcpDirPath, "xmcp.filter.ts");
    fs.writeFileSync(filterFilePath, filterTemplate);
    console.log(chalk.green(`Created filter: ${xmcpPath}/xmcp.filter.ts`));

    // Create xmcp.controller.ts
    const controllerFilePath = path.join(xmcpDirPath, "xmcp.controller.ts");
    fs.writeFileSync(controllerFilePath, controllerTemplate);
    console.log(chalk.green(`Created controller: ${xmcpPath}/xmcp.controller.ts`));

    // Create xmcp.module.ts
    const moduleFilePath = path.join(xmcpDirPath, "xmcp.module.ts");
    fs.writeFileSync(moduleFilePath, moduleTemplate);
    console.log(chalk.green(`Created module: ${xmcpPath}/xmcp.module.ts`));

    // Create xmcp.auth.ts
    const authFilePath = path.join(xmcpDirPath, "xmcp.auth.ts");
    fs.writeFileSync(authFilePath, authTemplate);
    console.log(chalk.green(`Created auth guard: ${xmcpPath}/xmcp.auth.ts`));
  } catch (error) {
    console.error(chalk.red(`Failed to create NestJS module: ${error}`));
    process.exit(1);
  }
}

const filterTemplate = `import { ExceptionFilter, Catch, ArgumentsHost, Logger } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class McpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(McpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      "MCP request failed",
      exception instanceof Error ? exception.stack : String(exception)
    );

    if (!response.headersSent) {
      response.status(500).json({
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
`;

const controllerTemplate = `import { Controller, UseFilters } from "@nestjs/common";
import { XmcpController } from "@xmcp/adapter";
import { McpExceptionFilter } from "./xmcp.filter";

@Controller("mcp")
@UseFilters(McpExceptionFilter)
export class McpController extends XmcpController {}
`;

const moduleTemplate = `import { Module } from "@nestjs/common";
import { XmcpService, OAuthModule } from "@xmcp/adapter";
import { McpController } from "./xmcp.controller";
import { McpExceptionFilter } from "./xmcp.filter";

@Module({
  imports: [
    OAuthModule.forRoot({
      authorizationServers: [process.env.OAUTH_ISSUER || "https://auth.example.com"],
    }),
  ],
  controllers: [McpController],
  providers: [XmcpService, McpExceptionFilter],
  exports: [XmcpService],
})
export class XmcpModule {}
`;

const authTemplate = `import { createMcpAuthGuard } from "@xmcp/adapter";

/**
 * MCP Auth Guard configuration.
 *
 * To enable authentication:
 * 1. Add McpAuthGuard to providers in xmcp.module.ts
 * 2. Add @UseGuards(McpAuthGuard) to xmcp.controller.ts
 */
export const McpAuthGuard = createMcpAuthGuard({
  verifyToken: async (token) => {
    // TODO: Implement your token verification logic
    // Example with JWT:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    // return {
    //   clientId: decoded.sub || "unknown",
    //   scopes: decoded.scope?.split(" ") || [],
    //   expiresAt: decoded.exp,
    // };

    throw new Error("Token verification not implemented");
  },
  required: false, // Set to true to require authentication
});
`;

