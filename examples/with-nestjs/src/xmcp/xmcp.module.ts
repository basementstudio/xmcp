import { Module } from "@nestjs/common";
import { XmcpService } from "@xmcp/adapter";
import { McpController } from "./xmcp.controller";
import { McpExceptionFilter } from "./xmcp.filter";

@Module({
  controllers: [McpController],
  providers: [XmcpService, McpExceptionFilter],
  exports: [XmcpService],
})
export class XmcpModule {}
