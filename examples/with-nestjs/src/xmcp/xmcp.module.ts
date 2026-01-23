import { Module } from "@nestjs/common";
import { XmcpService, OAuthController, OAuthService, OAUTH_CONFIG } from "@xmcp/adapter";
import { McpController } from "./xmcp.controller";
import { McpExceptionFilter } from "./xmcp.filter";

@Module({
  controllers: [McpController, OAuthController],
  providers: [
    XmcpService,
    OAuthService,
    McpExceptionFilter,
    {
      provide: OAUTH_CONFIG,
      useValue: {
        authorizationServers: [process.env.OAUTH_ISSUER || "https://auth.example.com"],
      },
    },
  ],
  exports: [XmcpService],
})
export class XmcpModule {}
