import { AnimatedLink } from "@/components/animated-link";

export const Footer = () => {
  return (
    <footer className="text-center text-sm text-white flex flex-col-reverse sm:flex-row py-8 px-4 gap-4 justify-between w-full">
      <div className="flex-1 flex justify-center sm:justify-start">
        <span className="flex items-center gap-2 z-100">
          <span>© 2025</span>
          <AnimatedLink
            href="https://xmcp.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            xmcp
          </AnimatedLink>
        </span>
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
