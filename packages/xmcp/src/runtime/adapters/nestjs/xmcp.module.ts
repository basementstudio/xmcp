import { Module } from "@nestjs/common";
import { XmcpController } from "./xmcp.controller";
import { XmcpService } from "./xmcp.service";
import { XmcpExceptionFilter } from "./xmcp.filter";
import { XmcpHealthIndicator } from "./xmcp.health";

@Module({
  controllers: [XmcpController],
  providers: [XmcpService, XmcpExceptionFilter, XmcpHealthIndicator],
  exports: [XmcpService, XmcpExceptionFilter, XmcpHealthIndicator],
})
export class XmcpModule {}
