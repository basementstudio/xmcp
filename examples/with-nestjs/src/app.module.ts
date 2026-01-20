import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { XmcpModule } from "@xmcp/adapter";
import { HealthModule } from "./health/health.module";
import { UsersModule } from "./users/users.module";
import configuration from "./config/configuration";

@Module({
  imports: [
    // Configuration management with environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env.local", ".env"],
    }),

    // Health check endpoints
    HealthModule,

    // Users domain module
    UsersModule,

    // XMCP MCP integration
    XmcpModule,
  ],
})
export class AppModule {}
