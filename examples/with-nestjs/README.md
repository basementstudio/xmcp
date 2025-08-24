# NestJS with XMCP Adapter

This example demonstrates how to integrate XMCP into a NestJS application using the experimental adapter feature.

## Features

- **NestJS Integration**: Seamless integration with NestJS controllers and decorators
- **Multiple Usage Patterns**: Five different ways to use the XMCP adapter:
  1. Direct handler usage
  2. Controller class method
  3. Decorator-based approach
  4. Authentication-enabled handler
  5. Middleware-enhanced handler
- **Authentication Support**: Built-in authentication with token verification and scope checking
- **TypeScript Support**: Full TypeScript support with proper type definitions
- **Error Handling**: Enhanced error handling with custom exceptions

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

   This will start both the XMCP compiler and the NestJS development server.

3. Build for production:
   ```bash
   npm run build
   ```

## Usage

The XMCP endpoint is available at `/mcp` and supports both GET and POST requests.

### Method 1: Direct Handler Usage

```typescript
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { xmcpHandler } from '@xmcp/adapter';

@Controller('mcp')
export class AppController {
  @Post()
  async handleMcpRequest(@Req() req: Request, @Res() res: Response) {
    return xmcpHandler(req, res);
  }
}
```

### Method 2: Controller Class

```typescript
import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { XmcpController } from '@xmcp/adapter';

@Controller('mcp')
export class AppController {
  @Get()
  async handleMcpGet(@Req() req: Request, @Res() res: Response) {
    return XmcpController.handleMcpRequest(req, res);
  }
}
```

### Method 3: Decorator

```typescript
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { XmcpEndpoint } from '@xmcp/adapter';

@Controller('mcp')
export class AppController {
  @Post('endpoint')
  @XmcpEndpoint()
  async handleMcpWithDecorator(@Req() req: Request, @Res() res: Response) {
    // This method will be replaced by the decorator
    return;
  }
}
```

### Method 4: With Authentication

```typescript
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { xmcpHandler, withAuth } from '@xmcp/adapter';

@Controller('mcp')
export class AppController {
  @Post('auth')
  async handleMcpWithAuth(@Req() req: Request, @Res() res: Response) {
    const authenticatedHandler = withAuth(xmcpHandler, {
      required: true,
      verifyToken: async (req: Request, token: string) => {
        // Your token verification logic here
        return { id: 'user-123', scopes: ['read', 'write'] };
      },
      requiredScopes: ['read'],
    });
    
    return authenticatedHandler(req, res);
  }
}
```

### Method 5: With Middleware

```typescript
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { xmcpHandler, createXmcpMiddleware } from '@xmcp/adapter';

@Controller('mcp')
export class AppController {
  @Post('middleware')
  async handleMcpWithMiddleware(@Req() req: Request, @Res() res: Response) {
    // Apply XMCP middleware for additional context
    const xmcpMiddleware = createXmcpMiddleware();
    return xmcpHandler(req, res);
  }
}
```

## Configuration

The XMCP configuration is in `xmcp.config.ts`:

```typescript
import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "nestjs",
  },
};

export default config;
```

## Tools

This example includes a simple greeting tool in `src/tools/greet.ts` that demonstrates how to create XMCP tools.

## Authentication

The NestJS adapter supports authentication through the `withAuth` function. You can configure:

- **Token Verification**: Custom token validation logic
- **Required Authentication**: Make authentication mandatory
- **Scope Checking**: Verify user permissions and scopes

### Example Authentication Service

```typescript
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthService {
  async verifyToken(req: Request, token: string) {
    // Your token verification logic here
    // Return user object with scopes and permissions
    return {
      id: 'user-123',
      email: 'user@example.com',
      scopes: ['read', 'write'],
      permissions: ['tools:read', 'tools:write'],
    };
  }
}
```

## Notes

- The adapter mode is experimental and may change in future versions
- Middleware is not supported in adapter mode
- The adapter provides seamless integration with NestJS decorators and dependency injection
- Authentication is fully supported with custom token verification and scope checking
