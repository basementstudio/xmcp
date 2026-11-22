"use client";

import { toast } from "@/lib/hooks/use-toast";
import { ActionCard } from "@/components/action-card";
import { ActionCardGrid } from "@/components/action-card-grid";

type ClientIconKey = "cursor" | "claude" | "windsurf" | "gemini" | "codex";

interface McpConnectProps {
  serverName?: string;
  serverUrl: string;
}

interface ConnectionOption {
  label: string;
  icon: ClientIconKey;
  type: "copy" | "link";
  getSnippet?: (identifier: string, url: string) => string;
  getLink?: (identifier: string, url: string) => string;
}

const CONNECTION_OPTIONS: ConnectionOption[] = [
  {
    label: "Cursor",
    icon: "cursor",
    type: "link",
    getLink: (id, url) => {
      const config = btoa(JSON.stringify({ url }));
      return `cursor://anysphere.cursor-deeplink/mcp/install?name=${id}&config=${config}`;
    },
  },
  {
    label: "Claude Code",
    icon: "claude",
    type: "copy",
    getSnippet: (id, url) => `claude mcp add --transport http "${id}" "${url}"`,
  },
  {
    label: "Claude Desktop",
    icon: "claude",
    type: "copy",
    getSnippet: (id, url) => `{
  "${id}": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "${url}"]
  }
}`,
  },
  {
    label: "Windsurf",
    icon: "windsurf",
    type: "copy",
    getSnippet: (id, url) => `"${id}": {
  "command": "npx",
  "args": ["mcp-remote", "${url}"]
}`,
  },
  {
    label: "Gemini CLI",
    icon: "gemini",
    type: "copy",
    getSnippet: (id, url) => `gemini mcp add --transport http "${id}" "${url}"`,
  },
  {
    label: "Codex",
    icon: "codex",
    type: "copy",
    getSnippet: (id, url) => `[mcp_servers.${id}]
command = "npx"
args = ["-y", "mcp-remote", "${url}"]`,
  },
];

export function McpConnect({
  serverName = "xmcp-docs",
  serverUrl,
}: McpConnectProps) {
  const identifier = serverName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} config copied to clipboard` });
    } catch {
      toast({ title: "Failed to copy" });
    }
  };

  const handleClick = (option: ConnectionOption) => {
    if (option.type === "link" && option.getLink) {
      window.open(option.getLink(identifier, serverUrl), "_blank");
    } else if (option.getSnippet) {
      copyToClipboard(option.getSnippet(identifier, serverUrl), option.label);
    }
  };

  return (
    <ActionCardGrid>
      {CONNECTION_OPTIONS.map((option) => (
        <ActionCard
          key={option.label}
          label={option.label}
          icon={option.icon}
          onClick={() => handleClick(option)}
        />
      ))}
    </ActionCardGrid>
  );
}
