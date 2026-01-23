import { Module } from "@nestjs/common";
import { UsersModule } from "./users/users.module";
import { XmcpModule } from "@xmcp/adapter";

@Module({
  imports: [
    // Users domain module - demonstrates integration with existing NestJS services
    UsersModule,

    // xMCP module - exposes MCP endpoint at POST /api/v1/mcp
    // See src/custom-route/ for implementation details
    XmcpModule,
  ],
})
export class AppModule {}
