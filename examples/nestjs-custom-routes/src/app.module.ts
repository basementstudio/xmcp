import { Module } from "@nestjs/common";
import { XmcpCoreModule } from "@xmcp/adapter";
import { CustomMcpController } from "./mcp/custom-mcp.controller";

/**
 * This example demonstrates using XmcpCoreModule instead of XmcpModule.
 *
 * XmcpModule provides:
 * - XmcpService
 * - XmcpController (default /mcp route)
 *
 * XmcpCoreModule provides:
 * - XmcpService only (no default controller)
 *
 * Use XmcpCoreModule when you need:
 * - Custom route paths (e.g., /api/v1/mcp instead of /mcp)
 * - Custom middleware or guards on the MCP endpoint
 * - Multiple MCP endpoints with different configurations
 * - Integration with API versioning
 */
@Module({
  imports: [
    // Import XmcpCoreModule to get XmcpService without the default controller
    // This allows us to define our own controller with custom routes
    XmcpCoreModule,
  ],
  controllers: [CustomMcpController],
})
export class AppModule {}
