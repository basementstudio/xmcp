import { Module } from "@nestjs/common";
import { UsersModule } from "./users/users.module";
import { XmcpModule } from "./xmcp/xmcp.module";

@Module({
  imports: [
    // Users domain module - demonstrates integration with existing NestJS services
    UsersModule,

    // xmcp module exposes /mcp route - customize the route in src/xmcp/xmcp.controller.ts
    XmcpModule,
  ],
})
export class AppModule {}
