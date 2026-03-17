import { Module, DynamicModule } from "@nestjs/common";
import { OAuthService, OAuthConfig, OAUTH_CONFIG } from "./xmcp.oauth.service";
import { OAuthController } from "./xmcp.oauth.controller";

@Module({})
export class OAuthModule {
  static forRoot(config: OAuthConfig): DynamicModule {
    return {
      module: OAuthModule,
      controllers: [OAuthController],
      providers: [
        {
          provide: OAUTH_CONFIG,
          useValue: config,
        },
        OAuthService,
      ],
      exports: [OAuthService],
    };
  }
}
