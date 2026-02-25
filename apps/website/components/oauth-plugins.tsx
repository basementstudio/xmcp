"use client";

import { ActionCard } from "@/components/action-card";
import { ActionCardGrid } from "@/components/action-card-grid";

const OAUTH_PLUGINS = [
  {
    label: "Better Auth",
    icon: "betterAuth" as const,
    href: "/docs/integrations/better-auth",
  },
  {
    label: "Clerk",
    icon: "clerk" as const,
    href: "/docs/integrations/clerk",
  },
  {
    label: "WorkOS",
    icon: "workos" as const,
    href: "/docs/integrations/workos",
  },
  {
    label: "Auth0",
    icon: "auth0" as const,
    href: "/docs/integrations/auth0",
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
