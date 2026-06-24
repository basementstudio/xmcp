import { AnimatedLink } from "@/components/animated-link";
import { Icons } from "@/components/icons";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="text-center text-sm text-white flex flex-col-reverse sm:flex-row sm:items-end py-8 px-4 gap-4 justify-between w-full">
      <div className="flex-1 items- flex justify-center sm:justify-start">
        <span className="flex items-center gap-2 z-100 text-brand-neutral-200">
          © xmcp {year} All rights reserved.
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-end gap-1 z-100 text-brand-neutral-200">
        <AnimatedLink
          href="https://vercel.com/oss"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-brand-neutral-200 hover:text-white transition-colors"
        >
          <span className="text-xs uppercase tracking-wider">
            Open Source Program
          </span>
          <Icons.vercelGeist aria-hidden="true" className="h-3.5 w-auto" />
        </AnimatedLink>
      </div>
      <div className="flex-1 flex gap-4 justify-center sm:justify-end">
        <AnimatedLink
          href="https://npmjs.com/package/xmcp"
          target="_blank"
          rel="noopener noreferrer"
        >
          NPM
        </AnimatedLink>
        <AnimatedLink
          href="https://github.com/basementstudio/xmcp"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </AnimatedLink>
        <AnimatedLink
          href="https://x.com/xmcp_dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          X
        </AnimatedLink>
        <AnimatedLink
          href="https://discord.gg/d9a7JBBxV9"
          target="_blank"
          rel="noopener noreferrer"
        >
          Discord
        </AnimatedLink>
      </div>
    </footer>
  );
};
