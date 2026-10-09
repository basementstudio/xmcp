import { type ComponentType, useId } from "react";
import { Icons } from "../icons";
import {
  ArchiveIcon,
  AvatarIcon,
  BarChartIcon,
  CardStackPlusIcon,
  ChatBubbleIcon,
  ColorWheelIcon,
  CubeIcon,
  DownloadIcon,
  FileTextIcon,
  GlobeIcon,
  GroupIcon,
  HomeIcon,
  IdCardIcon,
  InfoCircledIcon,
  LayersIcon,
  LightningBoltIcon,
  Link2Icon,
  ListBulletIcon,
  LockClosedIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  PaperPlaneIcon,
  PersonIcon,
  TokensIcon,
  TimerIcon,
} from "@radix-ui/react-icons";

export const sidebarIcons: Partial<
  Record<string, ComponentType<{ className?: string; id?: string }>>
> = {
  "/docs": HomeIcon,
  "/docs/getting-started/installation": DownloadIcon,
  "/docs/getting-started/project-structure": ListBulletIcon,
  "/docs/getting-started/connecting": Link2Icon,
  "/docs/configuration/transports": PaperPlaneIcon,
  "/docs/configuration/server-info": InfoCircledIcon,
  "/docs/configuration/custom-directories": ArchiveIcon,
  "/docs/configuration/bundler": CubeIcon,
  "/docs/configuration/telemetry": BarChartIcon,
  "/docs/configuration/observability": BarChartIcon,
  "/docs/configuration/components": LayersIcon,
  "/docs/core-concepts/request-context": IdCardIcon,
  "/docs/core-concepts/mcp-apps": CubeIcon,
  "/docs/core-concepts/tools": LightningBoltIcon,
  "/docs/core-concepts/prompts": ChatBubbleIcon,
  "/docs/core-concepts/resources": FileTextIcon,
  "/docs/core-concepts/middlewares": LayersIcon,
  "/docs/core-concepts/css": ColorWheelIcon,
  "/docs/core-concepts/external-clients": GlobeIcon,
  "/docs/authentication/api-key": LockClosedIcon,
  "/docs/authentication/jwt": TokensIcon,
  "/docs/authentication/oauth": PersonIcon,
  "/docs/adapters/tanstack": Icons.tanstack,
  "/docs/adapters/nextjs": Icons.nextjs,
  "/docs/adapters/nestjs": Icons.nestjs,
  "/docs/adapters/express": Icons.express,
  "/docs/adapters/fastify": Icons.fastify,
  "/docs/adapters/hono": Icons.hono,
  "/docs/adapters/sveltekit": Icons.sveltekit,
  "/docs/adapters/nuxt": Icons.nuxt,
  "/docs/adapters/react-router": Icons.reactRouter,
  "/docs/adapters/astro": Icons.astro,
  "/docs/deployment/vercel": Icons.vercel,
  "/docs/deployment/cloudflare": Icons.cloudflare,
  "/docs/deployment/alpic": Icons.alpic,
  "/docs/deployment/replit": Icons.replit,
  "/docs/deployment/railway": Icons.railway,
  "/docs/deployment/render": Icons.render,
  "/docs/integrations/auth0": Icons.auth0,
  "/docs/integrations/better-auth": Icons.betterAuth,
  "/docs/integrations/clerk": Icons.clerk,
  "/docs/integrations/commet": Icons.commet,
  "/docs/integrations/descope": Icons.descope,
  "/docs/integrations/polar": Icons.polar,
  "/docs/integrations/scalekit": Icons.scalekit,
  "/docs/integrations/sentry": BarChartIcon,
  "/docs/integrations/supabase": Icons.supabase,
  "/docs/integrations/billing": Icons.stripe,
  "/docs/integrations/coinbase": Icons.coinbase,
  "/docs/integrations/upstash": TimerIcon,
  "/docs/integrations/workos": Icons.workos,
  "/docs/integrations/x402": Icons.x402,
  "/docs/discoverability/smithery": MagnifyingGlassIcon,
  "/docs/discoverability/mcp-server-card": IdCardIcon,
  "/docs/guides/ui-rendering": MagicWandIcon,
  "/docs/guides/xmcp-mcp-server": MagicWandIcon,
  "/docs/guides/authentication": AvatarIcon,
  "/docs/guides/roll-out-to-a-team": GroupIcon,
  "/docs/guides/monetization": CardStackPlusIcon,
};

export function DocsPageIcon({
  item,
}: {
  item: { url: string; icon?: React.ReactNode };
}) {
  const iconId = useId();
  const Icon = sidebarIcons[item.url] ?? FileTextIcon;
  return (
    <span
      aria-hidden="true"
      className="shrink-0 text-brand-neutral-100 [&_svg]:size-4"
    >
      {item.icon ?? <Icon id={iconId} />}
    </span>
  );
}
