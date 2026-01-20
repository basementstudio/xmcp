import { Module } from "@nestjs/common";
import { XmcpService } from "./xmcp.service";

/**
 * Core NestJS module for xmcp that provides only the XmcpService.
 * Use this module when you want to create your own custom MCP controller.
 *
 * @example
 * ```typescript
 * import { XmcpCoreModule, XmcpService } from "@xmcp/adapter";
 *
 * @Module({
 *   imports: [XmcpCoreModule],
 *   controllers: [MyCustomMcpController],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  providers: [XmcpService],
  exports: [XmcpService],
})
export class XmcpCoreModule {}
