import { cn } from "@/lib/utils";
import Link from "next/link";

// Words that keep their own casing inside Sentence case labels.
const PROPER_WORDS: Record<string, string> = {
  ai: "AI",
  api: "API",
  auth0: "Auth0",
  b2b: "B2B",
  betterauth: "Better Auth",
  chatgpt: "ChatGPT",
  cli: "CLI",
  clerk: "Clerk",
  cloudflare: "Cloudflare",
  cms: "CMS",
  express: "Express",
  fastify: "Fastify",
  github: "GitHub",
  http: "HTTP",
  jwt: "JWT",
  mcp: "MCP",
  nestjs: "NestJS",
  nextjs: "Next.js",
  oauth: "OAuth",
  polar: "Polar",
  react: "React",
  scalekit: "Scalekit",
  saas: "SaaS",
  sdk: "SDK",
  stdio: "STDIO",
  tailwind: "Tailwind",
  typescript: "TypeScript",
  ui: "UI",
  vercel: "Vercel",
  workos: "WorkOS",
};

/** Sentence case for every tag label, keeping acronyms and brand names. */
export function formatTag(text: string) {
  const whole = PROPER_WORDS[text.toLowerCase().replace(/[^a-z0-9]/g, "")];
  if (whole) return whole;
  const words = text.trim().split(/(\s+|-)/);
  let first = true;
  return words
    .map((word) => {
      if (!word.trim() || word === "-") return word === "-" ? " " : word;
      const key = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      const proper = PROPER_WORDS[key];
      const out = proper
        ? proper
        : first
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word.toLowerCase();
      first = false;
      return out;
    })
    .join("")
    .replace(/\s+/g, " ");
}

type TagProps = {
  text?: string;
  className?: string;
  href?: string;
  interactive?: boolean;
  selected?: boolean;
};

export function tagClassName({
  interactive = false,
  selected = false,
}: {
  interactive?: boolean;
  selected?: boolean;
}) {
  const base =
    "site-chip py-1 px-2.5 text-[12px] leading-[18px] rounded-full border border-transparent transition-colors duration-200";

  if (!interactive) {
    return cn(base, "bg-brand-neutral-600 text-brand-neutral-100");
  }

  if (selected) {
    return cn(base, "site-chip-selected");
  }

  return cn(
    base,
    "bg-brand-neutral-600 text-brand-neutral-100 hover:text-brand-white hover:bg-brand-neutral-500"
  );
}

export const Tag = ({
  text,
  className,
  href,
  interactive = Boolean(href),
  selected = false,
}: TagProps) => {
  const classes = cn(
    tagClassName({ interactive, selected }),
    interactive &&
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-white/70",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {text && formatTag(text)}
      </Link>
    );
  }

  return <div className={classes}>{text && formatTag(text)}</div>;
};
