import { type ComponentType, useId } from "react";

import {
  ActivityIcon,
  AppWindowIcon,
  ArchiveIcon,
  AvatarIcon,
  BarChartIcon,
  CardStackPlusIcon,
  ChatBubbleIcon,
  ColorWheelIcon,
  CodeIcon,
  Component2Icon,
  CubeIcon,
  DownloadIcon,
  FileTextIcon,
  FileInputIcon,
  FingerprintIcon,
  GlobeIcon,
  GroupIcon,
  HomeIcon,
  IdCardIcon,
  InfoCircledIcon,
  LayersIcon,
  KeyRoundIcon,
  LightningBoltIcon,
  Link2Icon,
  ListBulletIcon,
  LockClosedIcon,
  MagicWandIcon,
  PaperPlaneIcon,
  ScanLineIcon,
  TimerIcon,
  TokensIcon,
} from "@/components/ui/site-icons";

import { Icons } from "../icons";
import { IntegrationIcons } from "./integration-icons";

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
  "/docs/configuration/observability": ActivityIcon,
  "/docs/configuration/caching": TimerIcon,
  "/docs/configuration/components": Component2Icon,
  "/docs/configuration/schema-inference": ScanLineIcon,
  "/docs/core-concepts/request-context": FingerprintIcon,
  "/docs/core-concepts/mcp-apps": AppWindowIcon,
  "/docs/core-concepts/tools": LightningBoltIcon,
  "/docs/core-concepts/prompts": ChatBubbleIcon,
  "/docs/core-concepts/resources": FileTextIcon,
  "/docs/core-concepts/skills": IntegrationIcons.agentSkills,
  "/docs/core-concepts/middlewares": LayersIcon,
  "/docs/core-concepts/css": ColorWheelIcon,
  "/docs/core-concepts/external-clients": GlobeIcon,
  "/docs/authentication/api-key": LockClosedIcon,
  "/docs/authentication/jwt": TokensIcon,
  "/docs/authentication/oauth": KeyRoundIcon,
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
  "/docs/integrations/figma": IntegrationIcons.figma,
  "/docs/integrations/higgsfield": IntegrationIcons.higgsfield,
  "/docs/integrations/krea": IntegrationIcons.krea,
  "/docs/integrations/topaz": IntegrationIcons.topaz,
  "/docs/integrations/black-forest-labs": IntegrationIcons.bfl,
  // The OpenAI and Gemini marks already ship with the page actions.
  "/docs/integrations/openai-images": Icons.codex,
  "/docs/integrations/gemini-images": Icons.gemini,
  "/docs/integrations/flue": IntegrationIcons.flue,
  "/docs/integrations/eve": IntegrationIcons.eve,
  "/docs/integrations/mastra": IntegrationIcons.mastra,
  "/docs/integrations/dramatiq": IntegrationIcons.dramatiq,
  "/docs/integrations/shopify-hydrogen": IntegrationIcons.shopifyHydrogen,
  "/docs/integrations/browserbase": IntegrationIcons.browserbase,
  "/docs/integrations/firecrawl": IntegrationIcons.firecrawl,
  "/docs/integrations/x": IntegrationIcons.x,
  "/docs/integrations/grok": IntegrationIcons.grok,
  "/docs/integrations/github": IntegrationIcons.github,
  "/docs/integrations/linear": IntegrationIcons.linear,
  "/docs/integrations/paper": IntegrationIcons.paper,
  "/docs/integrations/polar": Icons.polar,
  "/docs/integrations/profound": IntegrationIcons.profound,
  "/docs/integrations/resend": IntegrationIcons.resend,
  "/docs/integrations/scalekit": Icons.scalekit,
  "/docs/integrations/sentry": IntegrationIcons.sentry,
  "/docs/integrations/supabase": Icons.supabase,
  "/docs/integrations/billing": Icons.stripe,
  "/docs/integrations/coinbase": Icons.coinbase,
  "/docs/integrations/upstash": IntegrationIcons.upstash,
  "/docs/integrations/workos": Icons.workos,
  "/docs/integrations/x402": Icons.x402,
  "/docs/discoverability/mcp-server-card": IdCardIcon,
  "/docs/guides/ui-rendering": MagicWandIcon,
  "/docs/guides/import-openapi": FileInputIcon,
  "/docs/guides/xmcp-mcp-server": CodeIcon,
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
      className="shrink-0 text-brand-neutral-100 site-icon-slot"
    >
      {item.icon ?? <Icon id={iconId} />}
    </span>
  );
}
