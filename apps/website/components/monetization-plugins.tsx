"use client";

import { ActionCard } from "@/components/action-card";
import { ActionCardGrid } from "@/components/action-card-grid";
import { Icons } from "@/components/icons";

interface MonetizationPlugin {
  label: string;
  icon: keyof typeof Icons;
  href: string;
  paymentModel: string;
}

const MONETIZATION_PLUGINS: MonetizationPlugin[] = [
  {
    label: "Polar",
    icon: "polar",
    href: "/docs/integrations/polar",
    paymentModel: "License keys",
  },
  {
    label: "x402",
    icon: "x402",
    href: "/docs/integrations/x402",
    paymentModel: "USDC on Base",
  },
];

export function MonetizationPlugins() {
  return (
    <ActionCardGrid className="lg:grid-cols-2">
      {MONETIZATION_PLUGINS.map((plugin) => (
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
