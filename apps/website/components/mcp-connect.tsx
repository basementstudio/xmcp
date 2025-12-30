"use client";

import { cn } from "@/utils/cn";
import { toast } from "@/lib/hooks/use-toast";
import { Icons } from "@/components/icons";

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
    <div className="not-prose">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-6">
        {CONNECTION_OPTIONS.map((option) => {
          const IconComponent = Icons[option.icon];
          return (
            <button
              key={option.label}
              onClick={() => handleClick(option)}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5",
                "border border-brand-neutral-600 bg-[rgba(5,5,5,0.85)]",
                "hover:border-brand-neutral-400 hover:bg-[rgba(15,15,15,0.85)]",
                "transition-all duration-200 cursor-pointer text-left overflow-hidden"
              )}
            >
              <span className="w-8 h-8 border border-dashed border-brand-neutral-400 bg-brand-neutral-600 grid place-items-center shrink-0">
                <IconComponent className="w-4 h-4 text-brand-w1" />
              </span>
              <span className="text-brand-w1 font-medium text-sm relative z-10">
                {option.label}
              </span>
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-brand-neutral-600 pointer-events-none">
                <IconComponent className="size-12" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
