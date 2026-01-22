import { Module } from "@nestjs/common";
import { XmcpController } from "./xmcp.controller";
import { XmcpService } from "./xmcp.service";

@Module({
  controllers: [XmcpController],
  providers: [XmcpService],
  exports: [XmcpService],
})
export class XmcpModule {}
