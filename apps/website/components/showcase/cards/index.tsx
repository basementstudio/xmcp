import { GitHubLogoIcon } from "@/components/ui/site-icons";
import { cn } from "../../../utils/cn";
import Link from "next/link";
import Image from "next/image";
import { CodeBlock } from "../../codeblock";
import { Tag } from "@/components/ui/tag";
import type { ShowcaseItem } from "@/utils/content";

export function ShowcaseCards({ mcps }: { mcps: readonly ShowcaseItem[] }) {
  return (
    <div className="site-card-grid">
      {mcps.map((mcp, index) => (
        <ShowcaseCard key={index} {...mcp} />
      ))}
    </div>
  );
}

export async function ShowcaseCard({
  className,
  ...item
}: {
  className?: string;
} & ShowcaseItem) {
  const { name, tagline, repositoryUrl, logo, connection, tag } = item;

  return (
    <div
      className={cn(
        "text-left group relative overflow-visible h-full min-w-0",
        className
      )}
    >
      <div className="site-card-surface relative p-4 h-full min-h-[12rem] w-full flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="showcase-logo" data-logo={logo}>
            <Image
              src={logo}
              alt=""
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h2 className="site-card-title break-words">{name}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 flex flex-col justify-between h-full">
            <p className="site-card-description">{tagline}</p>

            <CodeBlock>
              <pre>
                <code>{connection}</code>
              </pre>
            </CodeBlock>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <Tag text={tag} />
            </div>
            <div className="flex items-center gap-2">
              {repositoryUrl && (
                <Link
                  href={repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                  aria-label="View on GitHub"
                >
                  <GitHubLogoIcon className="mx-auto" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
