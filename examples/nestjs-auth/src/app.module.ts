import { Module } from "@nestjs/common";
import { XmcpCoreModule } from "@xmcp/adapter";
import { McpController } from "./mcp/mcp.controller";

@Module({
  imports: [
    // Import XmcpCoreModule to get XmcpService without the default controller
    // This allows us to define our own controller with @McpAuth
    XmcpCoreModule,
  ],
  controllers: [McpController],
})
export class AppModule {}
