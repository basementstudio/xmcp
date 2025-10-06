import { cn } from "../../../utils/cn";
import Link from "next/link";
import Image from "next/image";
import { CopyButton } from "../../ui/copy-button";
import { fetchMCPs } from "../../../basehub";
//import { getRepoStars } from "@/utils/github";

export type ShowcaseItem = {
  name: string;
  tagline: string;
  repositoryUrl?: string;
  logo: {
    url: string;
  };
  connection: string;
  tag: string;
};

export async function ShowcaseCards() {
  const mcps = await fetchMCPs();

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mcps.map((mcp: ShowcaseItem, index: number) => (
          <ShowcaseCard key={index} {...mcp} />
        ))}
      </section>
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
        "text-left group relative overflow-visible h-full min-w-[280px]",
        className
      )}
    >
      <div
        className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible"
        style={{ borderColor: "#333" }}
      />
      <div
        className="relative border border-muted p-4 group-hover:bg-black h-full min-h-[12rem] w-full flex flex-col"
        style={{ borderColor: "#333" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 border border-white/20 flex items-center justify-center bg-white/5 rounded overflow-hidden">
            <Image
              src={logo.url}
              alt={`${name} logo`}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              {repositoryUrl ? (
                <Link
                  href={repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-medium uppercase hover:underline"
                >
                  {name}{" "}
                  <span className="invisible group-hover:visible text-sm">
                    {"→"}
                  </span>
                </Link>
              ) : (
                <h4 className="text-white font-medium uppercase">{name}</h4>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 flex flex-col justify-between h-full">
            <p className="text-sm text-[#BABABA] leading-relaxed">{tagline}</p>

            <div className="space-y-2">
              <div className="bg-black/20 border border-white/10 rounded px-2 py-1 relative group/copy overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <code className="text-xs text-[#BABABA] font-mono whitespace-nowrap pr-8">
                  {connection}
                </code>
                <CopyButton
                  text={connection}
                  className="absolute top-1 right-3 opacity-0 group-hover/copy:opacity-100 transition-opacity duration-200"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <span className="text-xs px-2 py-1 border border-white/20 text-white/80 uppercase tracking-wide">
                {tag}
              </span>
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
                  <svg
                    className="w-4 h-4 text-[#BABABA]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.30 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
