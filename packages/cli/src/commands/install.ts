import { homedir } from "node:os";
import { join, win32 } from "node:path";
import type { ClientDefinition } from "xmcp/client";
import { resolveDiscoveryTarget } from "../utils/discovery-target.js";
import {
  updateMcpConfig,
  type McpConfig,
  type McpServerEntry,
} from "../utils/install-config.js";
import type {
  InstallClient,
  InstallOptions,
} from "../utils/install-options.js";

function parseInstallUrl(url: string): URL {
  if (!/^https?:/i.test(url))
    throw new Error("Server URLs must use HTTP or HTTPS.");
  // Validate the shape without expanding environment references or changing the
  // serialized value. Cursor also allows references in the hostname and port;
  // a port placeholder needs a numeric stand-in for URL validation.
  return new URL(
    url
      .replace(/:\$\{[^}]+\}(?=[/?#]|$)/g, ":1")
      .replace(/\$\{[^}]+\}/g, "server")
  );
}

export function defaultClientConfig(
  client: InstallClient,
  platform: NodeJS.Platform = process.platform,
  home: string = homedir(),
  appData: string | undefined = process.env.APPDATA
): string {
  // Cursor (macOS/Linux/Windows): ~/.cursor/mcp.json; project configs require
  // an explicit --config .cursor/mcp.json. https://cursor.com/docs/mcp
  const paths = platform === "win32" ? win32 : { join };
  if (client === "cursor") return paths.join(home, ".cursor", "mcp.json");
  // Claude Desktop macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
  // Windows: %APPDATA%\Claude\claude_desktop_config.json. Other OSes require
  // --config because no default is documented in the MCP connection guide:
  // https://modelcontextprotocol.io/docs/develop/connect-local-servers
  if (platform === "darwin")
    return join(
      home,
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json"
    );
  if (platform === "win32" && appData)
    return win32.join(appData, "Claude", "claude_desktop_config.json");
  throw new Error(
    "Cannot determine the Claude Desktop config path on this system. Use --config <path>."
  );
}

export function createInstallEntry(
  definition: ClientDefinition,
  client?: InstallClient
): McpServerEntry {
  if (definition.type === "stdio") {
    if (client === "claude-desktop" && definition.cwd)
      throw new Error(
        "Claude Desktop config does not document cwd. Use a STDIO command with absolute paths or a launch script instead."
      );
    return {
      command: definition.command,
      args: definition.args,
      ...(definition.env ? { env: definition.env } : {}),
      ...(definition.cwd ? { cwd: definition.cwd } : {}),
    };
  }
  if (client === "claude-desktop")
    throw new Error(
      "Claude Desktop's local config requires a STDIO command. Use --stdio npx -y mcp-remote <url>, or add a remote connector in Claude settings."
    );
  // Validate without serializing URL.href, which would escape literal ${ENV}
  // placeholders in a path. Installation must never resolve environment values.
  parseInstallUrl(definition.url);
  const headers = Object.fromEntries(
    (definition.headers ?? []).map((header) => [
      header.name,
      "env" in header
        ? `\${${client === "cursor" ? "env:" : ""}${header.env}}`
        : header.value,
    ])
  );
  return {
    url: definition.url,
    ...(Object.keys(headers).length ? { headers } : {}),
  };
}

export async function runInstall(
  options: InstallOptions
): Promise<{ config: McpConfig; path?: string; changed: boolean }> {
  const target = options.target;
  const directUrl = target && /^https?:/i.test(target);
  const definition: ClientDefinition = directUrl
    ? { type: "http", name: parseInstallUrl(target).hostname, url: target }
    : await resolveDiscoveryTarget(options);
  const name = options.name ?? definition.name;
  if (!name.trim()) throw new Error("The server name must not be empty.");
  const entry = createInstallEntry(definition, options.client);
  const file =
    options.config ??
    (options.client ? defaultClientConfig(options.client) : undefined);
  if (!file)
    return { config: { mcpServers: { [name]: entry } }, changed: false };
  return updateMcpConfig(file, name, entry, options);
}
