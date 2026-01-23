import { Module } from "@nestjs/common";
import { UsersModule } from "./users/users.module";
import { XmcpModule } from "@xmcp/adapter";

@Module({
  imports: [
    // Users domain module - demonstrates integration with existing NestJS services
    UsersModule,

    // xmcp module exposes /mcp route - if you want to implement custom routes, check /custom-route
    XmcpModule,
  ],
})
export class AppModule {}
