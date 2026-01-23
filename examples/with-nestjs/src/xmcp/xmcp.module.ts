import { Module } from "@nestjs/common";
import { XmcpService, OAuthModule } from "@xmcp/adapter";
import { McpController } from "./xmcp.controller";
import { McpExceptionFilter } from "./xmcp.filter";

@Module({
  imports: [
    OAuthModule.forRoot({
      authorizationServers: [process.env.OAUTH_ISSUER || "https://auth.example.com"],
    }),
  ],
  controllers: [McpController],
  providers: [XmcpService, McpExceptionFilter],
  exports: [XmcpService],
})
export class XmcpModule {}
