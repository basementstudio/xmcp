import { NextResponse } from "next/server";

export async function GET() {
  const llmsContent = `# xmcp — The TypeScript MCP framework

The framework for building & shipping MCP applications. Build MCP servers in TypeScript, and easily deploy to production.

## Documentation and Resources

- [Docs](https://xmcp.dev/docs): Comprehensive documentation for the xmcp framework, covering installation, configuration, and usage guidelines.
- [Examples](https://xmcp.dev/examples): A collection of practical examples demonstrating how to implement various features of the xmcp framework.
- [Showcase](https://xmcp.dev/showcase): A showcase of applications built using the xmcp framework, highlighting its capabilities and use cases.

## Getting Started - Creating an xmcp app

- [Create an xmcp app](https://xmcp.dev/docs#create-a-new-xmcp-app): Learn how to create an xmcp app with our documentation, providing step-by-step instructions for setting up your first application.

## Integration Guides - Plugging an xmcp app into an existing project

- [Next.js](https://xmcp.dev/docs#usage-with-nextjs): Instructions on how to plug an xmcp app into an existing Next.js project, enabling seamless integration with this popular React framework.
- [Express](https://xmcp.dev/docs#usage-with-express): Guidance on integrating an xmcp app with an existing Express project, allowing for robust server-side applications.

## Community and Support - Get help and connect with other developers

- [BASEMENT.STUDIO](https://basement.studio/): Incubated by Basement Studio.
- [NPM](https://npmjs.com/package/xmcp): Access to the npm package for xmcp, facilitating easy installation and management of dependencies.
- [X](https://x.com/xmcp_dev): Additional resources or content related to the xmcp framework you can find on X/Twitter.
- [Discord](https://discord.gg/FPRuDAhPX9): Join the xmcp community on Discord for support, discussions, and networking with other developers.`;

  return new NextResponse(llmsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
