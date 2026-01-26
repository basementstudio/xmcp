# NestJS + XMCP Enhanced Example

This example demonstrates a **professional, production-ready** NestJS application with full XMCP (Model Context Protocol) integration. It showcases proper NestJS patterns including configuration management, validation, exception handling, logging, health checks, and modular architecture.

## Features

### NestJS Features
- **Configuration Management** - `@nestjs/config` with typed configuration
- **Validation Pipeline** - Global `ValidationPipe` with `class-validator`
- **Exception Handling** - Custom `HttpExceptionFilter` for consistent error responses
- **Logging** - `LoggingInterceptor` for request/response logging with timing
- **Module Architecture** - Feature module pattern with the Users domain

### XMCP Features
- Full MCP integration at `/mcp` endpoint
- Automatic tool, prompt, and resource discovery
- Tools that interact with application data (Users)
- Dynamic resources with path parameters
- Hot reload in development mode

### XMCP NestJS Integration
- **Lifecycle Hooks** - `XmcpService` implements `OnModuleInit` and `OnModuleDestroy` for proper initialization/shutdown logging
- **Exception Filter** - `McpExceptionFilter` is scaffolded locally for customizable JSON-RPC error handling
- **Structured Logging** - All XMCP internal logs use NestJS `Logger`, automatically inheriting your app's logging configuration

#### Using the Exception Filter on Custom Routes

If you create a custom MCP route, apply the filter:

```typescript
import { Controller, UseFilters } from "@nestjs/common";
import { xmcpController } from "@xmcp/adapter";
import { McpExceptionFilter } from "./xmcp/xmcp.filter";

@Controller("custom/mcp")
@UseFilters(McpExceptionFilter)
export class CustomMcpController extends xmcpController {}
```

## Project Structure

```
with-nestjs/
├── src/
│   ├── main.ts                          # Bootstrap with global pipes, filters
│   ├── app.module.ts                    # Root module with all imports
│   │
│   ├── common/                          # Shared utilities
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Global exception handling
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts   # Request/response logging
│   │   └── guards/
│   │       └── api-key.guard.ts         # Example API key authentication
│   │
│   ├── config/                          # Configuration management
│   │   └── configuration.ts             # Typed configuration
│   │
│   ├── health/                          # Health check endpoints
│   │   ├── health.module.ts
│   │   └── health.controller.ts         # /health endpoint
│   │
│   ├── users/                           # Example domain module
│   │   ├── users.module.ts
│   │   ├── users.service.ts             # Business logic (in-memory)
│   │   ├── users.controller.ts          # REST endpoints
│   │   ├── entities/
│   │   │   └── user.entity.ts           # User type definition
│   │   └── dto/
│   │       └── create-user.dto.ts       # Validation example
│   │
│   ├── tools/                           # XMCP tools (auto-discovered)
│   │   ├── greet.ts                     # Basic greeting tool
│   │   ├── get-time.ts                  # Get current time
│   │   ├── get-user.ts                  # Fetch user by ID
│   │   ├── create-user.ts               # Create new user
│   │   └── list-users.ts                # List all users
│   │
│   ├── prompts/                         # XMCP prompts (auto-discovered)
│   │   ├── review-code.ts               # Code review prompt
│   │   └── explain-error.ts             # Error explanation prompt
│   │
│   └── resources/                       # XMCP resources (auto-discovered)
│       ├── (config)/
│       │   └── app.ts                   # Application configuration
│       └── (users)/
│           └── [userId]/
│               └── profile.ts           # Dynamic user profile resource
│
├── .env.example                         # Environment variables template
├── package.json
├── tsconfig.json
├── nest-cli.json
├── xmcp.config.ts
└── README.md
```

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

## Development

Run the development server with hot reload:

```bash
pnpm dev
```

This command runs both:
- `xmcp dev` - Watches for changes in tools/prompts/resources and rebuilds
- `nest start --watch` - Runs NestJS with hot reload

## Production

Build and run for production:

```bash
# Build both XMCP and NestJS
pnpm build

# Start the server
pnpm start
```

## Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with memory indicators |
| `/users` | GET | List all users (REST) |
| `/users` | POST | Create a new user (REST) |
| `/users/:id` | GET | Get user by ID (REST) |
| `/users/:id` | DELETE | Delete user by ID (REST) |
| `/mcp` | POST | MCP JSON-RPC endpoint |

## Testing the Application

### Health Check

```bash
curl http://localhost:3000/health
```

### REST API - Users

```bash
# List all users
curl http://localhost:3000/users

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get a specific user (replace {id} with actual ID)
curl http://localhost:3000/users/{id}
```

### MCP Endpoint

```bash
# List available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call list-users tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list-users",
      "arguments": {}
    },
    "id": 2
  }'

# Call create-user tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "create-user",
      "arguments": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    },
    "id": 3
  }'

# List available prompts
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"prompts/list","id":4}'

# List available resources
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","id":5}'
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Application
NODE_ENV=development
PORT=3000

# API Key Authentication (optional)
API_KEY=your-secret-api-key

# Logging
LOG_LEVEL=debug
```

### XMCP Configuration

The `xmcp.config.ts` file configures the XMCP adapter:

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

## NestJS Features Demonstrated

### 1. Configuration Management

Uses `@nestjs/config` with typed configuration:

```typescript
// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY,
});
```

### 2. Validation Pipeline

Global validation with class-validator decorators:

```typescript
// src/users/dto/create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

### 3. Exception Handling

Custom exception filter for consistent error responses:

```typescript
// src/common/filters/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // Handles all exceptions with consistent JSON response
}
```

### 4. Logging Interceptor

Request/response logging with timing:

```typescript
// src/common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Logs: GET /users 200 - 15ms
}
```

### 5. Health Checks

Production-ready health indicators:

```typescript
// src/health/health.controller.ts
@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
  ]);
}
```

### 6. API Key Guard (Optional)

Protect routes with API key authentication:

```typescript
// src/app.module.ts - To enable globally
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
```

## Adding New Components

### Adding a Tool

Create a new file in `src/tools/`:

```typescript
// src/tools/my-tool.ts
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  input: z.string().describe("Description of the input"),
};

export const metadata: ToolMetadata = {
  name: "my-tool",
  description: "What this tool does",
};

export default async function myTool({ input }: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: `Result: ${input}` }],
  };
}
```

### Adding a Prompt

Create a new file in `src/prompts/`:

```typescript
// src/prompts/my-prompt.ts
import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  topic: z.string().describe("The topic to discuss"),
};

export const metadata: PromptMetadata = {
  name: "my-prompt",
  title: "My Prompt",
  description: "Description of what this prompt does",
  role: "user",
};

export default function myPrompt({ topic }: InferSchema<typeof schema>) {
  return `Please help me with ${topic}...`;
}
```

### Adding a Resource

Create a new file in `src/resources/`:

```typescript
// src/resources/(category)/my-resource.ts
import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "my-resource",
  title: "My Resource",
  description: "Description of this resource",
};

export default function handler() {
  return "Resource content here";
}
```

## Data Sharing Between REST API and MCP Tools

This example demonstrates how MCP tools can interact with the same data as the REST API. The `UsersService` is shared using a singleton pattern:

```typescript
// src/users/users.service.ts
let usersServiceInstance: UsersService | null = null;

export function getUsersService(): UsersService {
  if (!usersServiceInstance) {
    usersServiceInstance = new UsersService();
  }
  return usersServiceInstance;
}

// Then in tools:
import { getUsersService } from "../users/users.service";

const usersService = getUsersService();
const users = usersService.findAll();
```

This allows AI assistants using MCP to interact with the same user data that's available through the REST API.

## Learn More

- [XMCP Documentation](https://xmcp.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [class-validator](https://github.com/typestack/class-validator)
- [@nestjs/config](https://docs.nestjs.com/techniques/configuration)
