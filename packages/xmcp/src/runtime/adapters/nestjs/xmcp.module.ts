import { Module, DynamicModule } from "@nestjs/common";
import { XmcpController } from "./xmcp.controller";
import { XmcpService } from "./xmcp.service";

export interface XmcpModuleOptions {
  /**
   * If true, the default /mcp controller will not be registered.
   * Use this when you want to create your own custom MCP controller.
   * @default false
   */
  disableController?: boolean;
}

/**
 * NestJS module for xmcp MCP integration.
 *
 * @example
 * Basic usage (with default /mcp controller):
 * ```typescript
 * @Module({
 *   imports: [XmcpModule],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * With custom controller (disable default):
 * ```typescript
 * @Module({
 *   imports: [XmcpModule.forRoot({ disableController: true })],
 *   controllers: [CustomMcpController],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  controllers: [XmcpController],
  providers: [XmcpService],
  exports: [XmcpService],
})
export class XmcpModule {
  /**
   * Configure the XmcpModule with options.
   *
   * @param options - Configuration options
   * @returns Dynamic module configuration
   */
  static forRoot(options?: XmcpModuleOptions): DynamicModule {
    const { disableController = false } = options || {};

    return {
      module: XmcpModule,
      controllers: disableController ? [] : [XmcpController],
      providers: [XmcpService],
      exports: [XmcpService],
    };
  }
}
