import { Module } from "@nestjs/common";
import { XmcpService } from "@xmcp/adapter";
import { CustomMcpController } from "./custom-mcp.controller";

/**
 * Module demonstrating custom MCP route.
 *
 * Use this module instead of XmcpModule when you need
 * to expose MCP at a custom endpoint path.
 */
@Module({
  controllers: [CustomMcpController],
  providers: [XmcpService],
})
export class CustomRouteModule {}
