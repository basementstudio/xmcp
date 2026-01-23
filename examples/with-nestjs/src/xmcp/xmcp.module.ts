import { Module } from "@nestjs/common";
import { xmcpService } from "@xmcp/adapter";
import { McpController } from "./xmcp.controller";
import { McpExceptionFilter } from "./xmcp.filter";

@Module({
  controllers: [McpController],
  providers: [xmcpService, McpExceptionFilter],
  exports: [xmcpService],
})
export class XmcpModule {}
