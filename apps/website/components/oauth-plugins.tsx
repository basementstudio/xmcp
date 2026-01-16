"use client";

import { ActionCard } from "@/components/action-card";
import { ActionCardGrid } from "@/components/action-card-grid";

const OAUTH_PLUGINS = [
  {
    label: "WorkOS",
    icon: "cursor" as const,
    href: "/docs/integrations/workos",
  },
  {
    label: "Clerk",
    icon: "claude" as const,
    href: "/docs/integrations/clerk",
  },
  {
    label: "Better Auth",
    icon: "windsurf" as const,
    href: "/docs/integrations/better-auth",
  },
];

export function OAuthPlugins() {
  return (
    <ActionCardGrid>
      {OAUTH_PLUGINS.map((plugin) => (
        <ActionCard
          key={plugin.label}
          label={plugin.label}
          icon={plugin.icon}
          href={plugin.href}
        />
      ))}
    </ActionCardGrid>
  );
}
