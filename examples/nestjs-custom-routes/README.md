# NestJS Custom Routes Example

This example demonstrates how to use `XmcpCoreModule` to create a custom MCP controller with custom route paths, instead of using the default `/mcp` endpoint.

## Features

- **`XmcpCoreModule`**: Provides only `XmcpService` without the default controller
- **Custom Route Path**: MCP endpoint at `/api/v1/mcp` instead of `/mcp`
- **Full Controller Flexibility**: Add custom middleware, guards, or interceptors
- **API Versioning Support**: Easily implement API versioning for MCP endpoints

## Project Structure

```
nestjs-custom-routes/
├── src/
│   ├── main.ts                       # Application bootstrap
│   ├── app.module.ts                 # Uses XmcpCoreModule
│   ├── mcp/
│   │   └── custom-mcp.controller.ts  # Custom path: /api/v1/mcp
│   └── tools/
│       └── greet.ts                  # Simple greeting tool
├── package.json
├── tsconfig.json
├── nest-cli.json
├── xmcp.config.ts
└── README.md
```

## Key Concepts

### XmcpModule vs XmcpCoreModule

| Module | Provides | Use Case |
|--------|----------|----------|
| `XmcpModule` | `XmcpService` + `XmcpController` | Default setup with `/mcp` endpoint |
| `XmcpCoreModule` | `XmcpService` only | Custom controllers and routes |

### Using XmcpCoreModule

```typescript
import { Module } from "@nestjs/common";
import { XmcpCoreModule } from "@xmcp/adapter";
import { CustomMcpController } from "./mcp/custom-mcp.controller";

@Module({
  imports: [XmcpCoreModule],  // Only provides XmcpService
  controllers: [CustomMcpController],  // Your custom controller
})
export class AppModule {}
```

### Custom Controller

```typescript
import { Controller, Post, Get, Options, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { XmcpService } from "@xmcp/adapter";

@Controller("api/v1/mcp")  // Custom route path
export class CustomMcpController {
  constructor(private readonly xmcpService: XmcpService) {}

  @Post()
  async handleMcp(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.xmcpService.handleRequest(req, res);
  }

  @Get()
  handleGet(@Res() res: Response): void {
    res.status(200).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. MCP requires POST requests." },
      id: null,
    });
  }

  @Options()
  handleOptions(@Res() res: Response): void {
    res.status(204).send();
  }
}
```

## Running the Example

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Test the custom endpoint:
   ```bash
   # List available tools
   curl -X POST http://localhost:3000/api/v1/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

   # Call the greet tool
   curl -X POST http://localhost:3000/api/v1/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"greet","arguments":{"name":"World"}},"id":2}'
   ```

## Use Cases for Custom Routes

### 1. API Versioning

```typescript
// v1 endpoint
@Controller("api/v1/mcp")
export class McpV1Controller { ... }

// v2 endpoint with different configuration
@Controller("api/v2/mcp")
export class McpV2Controller { ... }
```

### 2. Multi-tenant Setup

```typescript
@Controller("tenants/:tenantId/mcp")
export class TenantMcpController {
  @Post()
  async handleMcp(
    @Param("tenantId") tenantId: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    // Handle tenant-specific logic
    return this.xmcpService.handleRequest(req, res);
  }
}
```

### 3. Custom Middleware/Guards

```typescript
@Controller("admin/mcp")
@UseGuards(AdminGuard)  // Custom guard
@UseInterceptors(AuditInterceptor)  // Custom interceptor
export class AdminMcpController { ... }
```

## Comparison with XmcpModule.forRoot()

You can also use `XmcpModule.forRoot()` with `disableController: true`:

```typescript
// Using XmcpModule.forRoot()
@Module({
  imports: [XmcpModule.forRoot({ disableController: true })],
  controllers: [CustomMcpController],
})
export class AppModule {}

// Using XmcpCoreModule (equivalent, simpler)
@Module({
  imports: [XmcpCoreModule],
  controllers: [CustomMcpController],
})
export class AppModule {}
```

Both approaches are functionally equivalent. `XmcpCoreModule` is the recommended approach for cleaner code.
