import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { UsersModule } from "./users/users.module";
import { CustomRouteModule } from "./custom-route";
import configuration from "./config/configuration";
import { XmcpModule } from "@xmcp/adapter";

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

    // Custom MCP route - exposes MCP endpoint at POST /api/v1/mcp
    // See src/custom-route/ for implementation details
    XmcpModule,
  ],
})
export class AppModule {}
