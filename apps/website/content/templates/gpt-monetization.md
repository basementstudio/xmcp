---
name: "GPT Monetization with Stripe"
description: "A Next.js + MCP application for monetizing ChatGPT apps using Stripe"
category: "monetization"
tags: ["stripe", "chatgpt", "nextjs", "http"]
---

# xmcp GPT Monetization Template

Sell products directly from ChatGPT through Stripe's external checkout integration.

## Features

- Stripe product listing and checkout integration
- React widgets for product display in ChatGPT
- Success and cancel pages for checkout flow
- MCP endpoint at `/mcp` via Next.js adapter
- Custom hooks for tool invocation and external links
- Ready-to-deploy on Vercel

## Getting Started

### Prerequisites

You need a [Stripe](https://stripe.com) account with:

- Sandbox mode enabled
- Some one-off products created
- Your secret key (`sk_test_...`)

### 1. Create the project

```bash
npx create-xmcp-app --example gpt-monetization
```

### 2. Environment setup

```bash
cp .env.example .env
```

Add your Stripe secret key:

```bash
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Install & run

```bash
pnpm install
pnpm dev
```

This starts both the xmcp dev server and Next.js concurrently.

## Project Structure

```
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── success/page.tsx          # Payment success page
│   ├── cancel/page.tsx           # Payment cancel page
│   ├── mcp/route.ts              # MCP endpoint
│   └── products/page.tsx         # Products listing widget
├── tools/
│   ├── list-products.ts          # List Stripe products
│   └── buy-products.ts           # Create checkout session
├── hooks/
│   ├── use-call-tool.ts          # Invoke MCP tools
│   ├── use-tool-output.ts        # Access tool output
│   └── use-open-external.ts      # Open external links
├── components/
│   ├── product-grid.tsx
│   ├── product-card.tsx
│   └── copy-mcp-url-button.tsx
├── lib/
│   ├── stripe.ts                 # Stripe client
│   ├── base-url.ts               # URL utilities
│   └── utils.ts
├── xmcp.config.ts
└── next.config.ts
```

## Testing with ChatGPT

1. Deploy your app and get the MCP endpoint URL (`https://your-app.vercel.app/mcp`)
2. In ChatGPT, go to **Apps & Connectors** → **Advanced Settings** and enable developer mode
3. Create a new connector with your MCP server URL (no authentication required)
4. Start a new chat and use `/` to access your connector

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xmcp-dev/gpt-apps-monetization)

Or build manually:

```bash
pnpm build
```

## Learn More

- [Complete Guide](https://xmcp.dev/blog/apps-monetization)
- [xmcp Documentation](https://xmcp.dev/docs)
- [Stripe Documentation](https://docs.stripe.com)
