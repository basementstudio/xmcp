import { NextResponse } from "next/server";

export async function GET() {
  const llmsContent = `# xmcp Documentation

This documentation covers xmcp, a TypeScript framework for building and shipping MCP (Model Context Protocol) servers.

## Docs

- [Getting Started](https://xmcp.dev/docs#getting-started): Learn how to create a new xmcp application from scratch or add it to an existing project
- [Create a New xmcp App](https://xmcp.dev/docs#create-a-new-xmcp-app): The easiest way to get started using create-xmcp-app CLI tool with all necessary files and dependencies
- [Building with HTTP](https://xmcp.dev/docs#building-with-http): Deploy your MCP on a server for database operations and fetch operations in stateless mode
- [Building with STDIO](https://xmcp.dev/docs#building-with-stdio): Run your MCP server locally for machine operations like image processing and file management
- [Project Structure](https://xmcp.dev/docs#project-structure): Understanding the basic project layout with src/, tools/, dist/, and configuration files
- [Creating Tools](https://xmcp.dev/docs#creating-tools): Auto-discovery system for tools with Schema, Metadata, and Handler function exports
- [File Exports](https://xmcp.dev/docs#file-exports): Detailed explanation of Schema, Metadata, and Implementation requirements for tools
- [Development Commands](https://xmcp.dev/docs#development-commands): Essential npm commands for dev server, building, and running STDIO/HTTP transports
- [Using Tools](https://xmcp.dev/docs#using-tools): Configure MCP servers in clients like Cursor with HTTP and STDIO transport examples
- [Middlewares](https://xmcp.dev/docs#middlewares): HTTP server middleware for authentication, rate limiting, and request/response processing
- [Authentication](https://xmcp.dev/docs#authentication): API Key, JWT, and experimental OAuth authentication methods with middleware setup
- [API Key Authentication](https://xmcp.dev/docs#api-key): Using apiKeyAuthMiddleware with header validation and custom validation functions
- [JWT Authentication](https://xmcp.dev/docs#jwt): JWT middleware with jsonwebtoken library compatibility and secret configuration
- [OAuth Authentication](https://xmcp.dev/docs#oauth): Experimental Dynamic Client Registration with endpoint and scope configuration
- [xmcp/headers](https://xmcp.dev/docs#xmcpheaders): Access request headers in HTTP transport tools for external API integration
- [xmcp.config.ts](https://xmcp.dev/docs#xmcpconfigts): Configuration file for HTTP/STDIO transports, tools directory, and server settings
- [Custom Tools Directory](https://xmcp.dev/docs#custom-tools-directory): Configure custom path for tool discovery beyond default /src/tools/
- [Customize HTTP Transport](https://xmcp.dev/docs#customize-the-http-transport): HTTP server configuration including port, endpoint, body limits, and CORS
- [Custom Webpack Configuration](https://xmcp.dev/docs#custom-webpack-configuration): Extend webpack config for asset handling and custom build requirements
- [Experimental Features](https://xmcp.dev/docs#experimental-features): OAuth provider and Express/Next.js adapter configuration options
- [Vercel Deployment](https://xmcp.dev/docs#vercel-deployment): Zero-configuration deployment with Vercel CLI and Git repository integration
- [Usage with Next.js](https://xmcp.dev/docs#usage-with-nextjs): Experimental adapter for existing Next.js projects with init-xmcp setup
- [Usage with Express](https://xmcp.dev/docs#usage-with-express): Experimental adapter for existing Express projects with manual endpoint setup
- [Browse Examples](https://github.com/basementstudio/xmcp/tree/main/examples): Collection of practical examples demonstrating xmcp framework features

## Key Concepts

- **Transport Types**: HTTP (server deployment) vs STDIO (local execution)
- **Stateless Operation**: Each tool call creates new transport instance
- **Auto-discovery**: Tools automatically registered from tools directory
- **Type Safety**: Full TypeScript support with InferSchema utility
- **MCP Compatibility**: Returns standard MCP response format
- **Development Experience**: Hot reloading and built-in development server

## Framework Features

- **Middleware Support**: HTTP request/response processing with authentication and rate limiting
- **Authentication Methods**: API Key, JWT, and experimental OAuth with Dynamic Client Registration
- **Configuration Options**: Flexible HTTP/STDIO transport settings, custom tools directory, and webpack customization
- **Deployment Ready**: Zero-configuration Vercel deployment and production-ready builds
- **Framework Integration**: Experimental adapters for Next.js and Express.js projects
- **Tool Management**: Auto-discovery system with Zod schema validation and comprehensive error handling

## Getting Started Quick Reference

- Use \`npx create-xmcp-app@latest\` to scaffold new projects
- Choose HTTP transport for server deployment or STDIO for local execution
- Tools auto-discovered in \`/src/tools/\` directory with Schema, Metadata, and Handler exports
- Configure clients with HTTP URLs or STDIO command paths
- Deploy to Vercel with zero configuration or use custom deployment strategies

## Advanced Features

- **Headers Access**: Use \`xmcp/headers\` module for HTTP request header access in tools
- **Custom Webpack**: Extend build configuration for special asset handling requirements
- **Experimental OAuth**: Dynamic Client Registration with configurable endpoints and scopes
- **Adapter Pattern**: Integration with existing Next.js and Express.js applications
- **Production Ready**: Comprehensive middleware, authentication, and deployment options`;

  return new NextResponse(llmsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
