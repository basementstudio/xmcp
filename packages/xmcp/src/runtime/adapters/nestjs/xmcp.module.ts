import { Module } from "@nestjs/common";
import { XmcpController } from "./xmcp.controller";
import { XmcpService } from "./xmcp.service";
import { XmcpExceptionFilter } from "./xmcp.filter";

@Module({
  controllers: [XmcpController],
  providers: [XmcpService, XmcpExceptionFilter],
  exports: [XmcpService, XmcpExceptionFilter],
})
export class XmcpModule {}
