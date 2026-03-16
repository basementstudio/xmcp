FROM node:20-slim AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/xmcp/package.json packages/xmcp/
COPY examples/observability-grafana/package.json examples/observability-grafana/

RUN pnpm install --frozen-lockfile

COPY packages/xmcp/ packages/xmcp/
COPY examples/observability-grafana/ examples/observability-grafana/

RUN pnpm --filter "xmcp" build
RUN pnpm --filter "Observability Grafana" build

FROM node:20-slim

WORKDIR /app

COPY --from=build /app/examples/observability-grafana/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/examples/observability-grafana/node_modules ./example_modules
COPY --from=build /app/packages/xmcp ./packages/xmcp

RUN mkdir -p /var/log/xmcp

EXPOSE 3002

# Start the server, redirect stderr to a log file that promtail reads
# Use unbuffer-like approach to avoid buffering issues
CMD ["sh", "-c", "node dist/http.js 2> >(tee /var/log/xmcp/server.log >&2)"]
