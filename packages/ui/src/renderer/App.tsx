import React, { useEffect, useMemo } from "react";
import type { App as AppSchema } from "../schema/types.js";
import type { McpHostCallToolParams } from "xmcp/host-bridge";
import { StateProvider } from "./StateProvider.js";
import { ComponentRenderer } from "./ComponentRenderer.js";
import { ThemeProvider, useTheme, uiShellClassName } from "../react/theme.js";
import { cn } from "../react/utils.js";
import { RuntimeProvider } from "./RuntimeContext.js";
import { useMcpApp } from "./use-mcp-app.js";
import { createHttpMcpClient, sanitizeMcpHeaders } from "./http-client.js";

export interface AppProps {
  schema: AppSchema;
  className?: string;
  inheritTheme?: boolean;
  transportMode?: "http" | "host" | "auto";
  serverUrl?: string;
  allowedOrigins?: string[];
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

function getServerUrlError(
  serverUrl: string,
  allowedOrigins?: string[]
): { title: string; message: string } | null {
  const parsedServerUrl = parseHttpUrl(serverUrl);
  if (!parsedServerUrl) {
    return {
      title: "Invalid MCP Server URL",
      message: "The MCP server URL must use the http: or https: protocol.",
    };
  }

  if (allowedOrigins) {
    const normalizedOrigins = allowedOrigins
      .map(parseHttpUrl)
      .filter((url): url is URL => url !== null)
      .map((url) => url.origin);

    if (!normalizedOrigins.includes(parsedServerUrl.origin)) {
      return {
        title: "MCP Server Not Allowed",
        message: `The MCP server origin ${parsedServerUrl.origin} is not in the configured allowlist.`,
      };
    }
  }

  return null;
}

function AppBody({ schema, className, inheritTheme = false }: AppProps) {
  const theme = useTheme();

  return (
    <div
      className={cn(uiShellClassName, "p-6", className)}
      style={inheritTheme ? undefined : theme.style}
    >
      {schema.title && (
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          {schema.title}
        </h1>
      )}
      <ComponentRenderer node={schema.root} />
    </div>
  );
}

function ConfiguredApp({
  schema,
  className,
  inheritTheme = false,
  transportMode = "auto",
}: AppProps) {
  const mcpApp = useMcpApp();

  const headersKey = JSON.stringify(schema.mcpHeaders ?? []);
  const mcpClient = useMemo(
    () =>
      createHttpMcpClient({
        serverUrl: schema.mcpServerUrl,
        headers: JSON.parse(headersKey),
      }),
    [headersKey, schema.mcpServerUrl]
  );

  useEffect(() => {
    // The lazy client can reconnect after StrictMode's effect replay.
    if (
      transportMode === "host" ||
      (transportMode === "auto" && mcpApp.isConnected)
    ) {
      void mcpClient.close().catch(() => {});
    }
    return () => {
      void mcpClient.close().catch(() => {});
    };
  }, [mcpClient, transportMode, mcpApp.isConnected]);

  const hostClient = useMemo(
    () => ({
      callTool: async (params: McpHostCallToolParams) => {
        return mcpApp.callTool(params.name, params.arguments);
      },
      openLink: mcpApp.openLink,
      requestDisplayMode: mcpApp.requestDisplayMode,
      readResource: mcpApp.readResource,
      sendMessage: mcpApp.sendMessage,
      updateModelContext: mcpApp.updateModelContext,
      notifySizeChanged: mcpApp.notifySizeChanged,
      hostContext: mcpApp.hostContext,
      hostCapabilities: mcpApp.hostCapabilities,
      isConnected: mcpApp.isConnected,
    }),
    [mcpApp]
  );

  const runtimeClient = useMemo(() => {
    if (transportMode === "host") {
      return hostClient;
    }
    if (transportMode === "auto" && mcpApp.isConnected) {
      return hostClient;
    }
    return {
      ...mcpClient,
      openLink: mcpApp.openLink,
      requestDisplayMode: mcpApp.requestDisplayMode,
      readResource: mcpApp.readResource,
      sendMessage: mcpApp.sendMessage,
      updateModelContext: mcpApp.updateModelContext,
      notifySizeChanged: mcpApp.notifySizeChanged,
      hostContext: mcpApp.hostContext,
      hostCapabilities: mcpApp.hostCapabilities,
      isConnected: mcpApp.isConnected,
    };
  }, [hostClient, mcpApp, mcpClient, transportMode]);

  return (
    <RuntimeProvider client={runtimeClient}>
      <StateProvider initialState={schema.state}>
        {inheritTheme ? (
          <AppBody
            schema={schema}
            className={className}
            inheritTheme={inheritTheme}
          />
        ) : (
          <ThemeProvider
            mode={schema.theme === "light" ? "light" : "dark"}
            themeTokens={schema.themeTokens}
          >
            <AppBody schema={schema} className={className} />
          </ThemeProvider>
        )}
      </StateProvider>
    </RuntimeProvider>
  );
}

function AppConfigurationError({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div role="alert" className="rounded-lg border border-red-500 p-4">
      <h1 className="font-semibold">{title}</h1>
      <p>{message}</p>
    </div>
  );
}

export function App({ schema, serverUrl, allowedOrigins, ...props }: AppProps) {
  const effectiveServerUrl = serverUrl ?? schema.mcpServerUrl;
  const configurationError = getServerUrlError(
    effectiveServerUrl,
    allowedOrigins
  );

  if (configurationError) {
    return <AppConfigurationError {...configurationError} />;
  }

  return (
    <ConfiguredApp
      {...props}
      schema={{
        ...schema,
        mcpServerUrl: effectiveServerUrl,
        mcpHeaders: sanitizeMcpHeaders(schema.mcpHeaders),
      }}
    />
  );
}

export default App;
