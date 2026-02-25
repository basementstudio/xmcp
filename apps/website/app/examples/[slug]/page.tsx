import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ExampleCard } from "@/components/examples/cards/cards";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { getBaseUrl } from "@/lib/base-url";
import { CopyUrlButton } from "@/components/blog/copy-url";
import {
  DeployDropdown,
  type DeployOption,
  type DeployProvider,
} from "@/components/examples/deploy-dropdown";
import {
  ExampleItem,
  fetchExampleBySlug,
  fetchExampleReadme,
  fetchExamplesAndTemplates,
} from "@/app/examples/utils/github";
import { Icons } from "@/components/icons";
import { getMDXComponents } from "@/components/mdx-components";
import { CodeBlock } from "@/components/codeblock";
import { Github, Linkedin } from "lucide-react";

const baseUrl = getBaseUrl();

function stripLeadingHeading(markdown: string) {
  const lines = markdown.split("\n");
  const first = lines.findIndex((line) => line.trim().length > 0);
  if (first === -1) return markdown;

  const line = lines[first];
  const next = lines[first + 1] ?? "";

  const isAtx = /^#{1,6}\s+/.test(line);
  const isSetext =
    next.trim().length > 0 &&
    (/^=+$/.test(next.trim()) || /^-+$/.test(next.trim()));

  if (!isAtx && !isSetext) return markdown;

  const removeCount = isSetext ? 2 : 1;
  lines.splice(first, removeCount);

  while (first < lines.length && lines[first].trim().length === 0) {
    lines.splice(first, 1);
  }

  return lines.join("\n");
}

function buildVercelCloneUrl(example: ExampleItem) {
  const folderPath = example.path.replace(/^\/+/, "");
  const repoWithBranch = `https://github.com/${example.sourceRepo}/tree/${example.sourceBranch}/${folderPath}`;
  const search = new URLSearchParams({
    "repository-url": repoWithBranch,
  });

  return `https://vercel.com/new/clone?${search.toString()}`;
}

function getProviderFromUrl(url: string): DeployProvider {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();

  if (host.includes("vercel")) return "vercel";
  if (host.includes("netlify")) return "netlify";
  if (host.includes("railway")) return "railway";
  if (host.includes("render")) return "render";
  if (host.includes("cloudflare")) return "cloudflare";
  return "other";
}

function getProviderLabel(provider: DeployProvider) {
  switch (provider) {
    case "vercel":
      return "Vercel";
    case "netlify":
      return "Netlify";
    case "railway":
      return "Railway";
    case "render":
      return "Render";
    case "cloudflare":
      return "Cloudflare";
    default:
      return "Provider";
  }
}

export async function generateStaticParams() {
  const items = await fetchExamplesAndTemplates();
  return items.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/examples/[slug]">
): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug;
  const example = await fetchExampleBySlug(slug);
  if (!example) {
    return {
      title: "Example not found - xmcp",
      description: "The requested example could not be found.",
    };
  }

  const canonical = `${baseUrl}/examples/${slug}`;

  return {
    title: `${example.name} - xmcp examples`,
    description: example.description,
    alternates: { canonical },
    openGraph: {
      title: `${example.name} - xmcp examples`,
      description: example.description,
      url: canonical,
      siteName: "xmcp",
      type: "website",
      images: example.previewUrl
        ? [
            {
              url: example.previewUrl,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${example.name} - xmcp examples`,
      description: example.description,
      images: example.previewUrl ? [example.previewUrl] : undefined,
    },
  };
}

export default async function ExampleDetailPage(
  props: PageProps<"/examples/[slug]">
) {
  const params = await props.params;
  const slug = params.slug;
  const example = await fetchExampleBySlug(slug);
  if (!example) {
    notFound();
  }

  const [readmeContent, examples] = await Promise.all([
    fetchExampleReadme(example),
    fetchExamplesAndTemplates(),
  ]);

  const moreExamples = examples
    .filter((item) => item.kind !== example.kind || item.slug !== example.slug)
    .slice(0, 3);

  const fallbackReadme = `# README not found

Add a README.md to this template to show content here.`;
  const bodyContent = stripLeadingHeading(readmeContent ?? fallbackReadme);
  const vercelCloneUrl = buildVercelCloneUrl(example);
  const deployOptions: DeployOption[] = [
    {
      label: "Vercel",
      href: vercelCloneUrl,
      provider: "vercel",
    },
    {
      label: "Alpic",
      href: "https://alpic.ai/",
      provider: "alpic",
    },
  ];
  if (example.deployUrl && example.deployUrl !== vercelCloneUrl) {
    const provider = getProviderFromUrl(example.deployUrl);
    deployOptions.push({
      label: getProviderLabel(provider),
      href: example.deployUrl,
      provider,
    });
  }
  const pageUrl = `${baseUrl}/examples/${example.slug}`;
  const shareMessage = `Check out ${example.name} on xmcp`;
  const xShareUrl = `https://www.x.com/intent/post?text=${encodeURIComponent(
    shareMessage
  )}&url=${encodeURIComponent(pageUrl)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    pageUrl
  )}`;

  return (
    <main className="max-w-[1200px] w-full mx-auto px-4 py-12 md:py-16 space-y-10">
      <Breadcrumb name={example.name} />

      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-3">
          <h1 className="heading-1 text-gradient">{example.name}</h1>
          <p className="text-brand-neutral-100 text-base max-w-2xl">
            {example.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DeployDropdown options={deployOptions} variant="primary" />
          {example.demoUrl && (
            <Button asChild variant="secondary" size="sm" className="px-4">
              <Link
                href={example.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Demo
              </Link>
            </Button>
          )}
        </div>
      </header>

      <div className="relative w-full overflow-hidden rounded-xs border border-brand-neutral-500">
        <div className="aspect-video relative">
          {example.previewUrl ? (
            <Image
              src={example.previewUrl}
              alt={`${example.name} preview`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-brand-neutral-600/25 flex items-center justify-center">
              <div className="relative w-full max-w-[520px] aspect-[850/742] opacity-65">
                <Image
                  src="/xmcp.png"
                  alt="xmcp placeholder"
                  fill
                  sizes="(max-width: 768px) 90vw, 520px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-8">
          <div>
            <Link
              href={example.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-white text-brand-neutral-50 inline-flex items-center gap-2"
            >
              <Github className="size-4" />
              <span>GitHub</span>
            </Link>
          </div>

          {(example.demoUrl || example.websiteUrl) && (
            <InfoCard label="Website link">
              <Link
                href={example.demoUrl || example.websiteUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-white text-brand-neutral-50 underline underline-offset-2"
              >
                {example.demoUrl || example.websiteUrl}
              </Link>
            </InfoCard>
          )}

          {(example.category || (example.tags?.length ?? 0) > 0) && (
            <InfoCard label="Categories">
              <div className="flex flex-wrap gap-2">
                {example.category && <Tag text={example.category} />}
                {example.tags?.map((tag) => (
                  <Tag key={tag} text={tag} />
                ))}
              </div>
            </InfoCard>
          )}

          <InfoCard label="Share">
            <div className="flex items-center gap-4">
              <Link
                href={xShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
                className="inline-flex items-center text-brand-neutral-100 hover:text-brand-white"
              >
                <XIcon className="size-4" />
              </Link>
              <Link
                href={linkedinShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
                className="inline-flex items-center text-brand-neutral-100 hover:text-brand-white"
              >
                <Linkedin className="size-4" />
              </Link>
              <CopyUrlButton
                url={pageUrl}
                withIcon
                className="text-brand-neutral-100 hover:text-brand-white"
              />
            </div>
          </InfoCard>
        </aside>

        <section className="lg:col-span-9 space-y-6 pl-8 border-l border-brand-neutral-500">
          <div className="prose prose-invert max-w-none">
            <MDXRemote
              source={bodyContent}
              components={getMDXComponents({
                pre: ({ ref, ...props }) => (
                  <CodeBlock ref={ref} {...props}>
                    <pre>{props.children}</pre>
                  </CodeBlock>
                ),
              })}
            />
          </div>
        </section>
      </div>

      {moreExamples.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-brand-white">
            Other templates and examples
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moreExamples.map((item) => (
              <ExampleCard
                key={`${item.kind}-${item.slug}`}
                {...item}
                href={`/examples/${item.slug}`}
                target="_self"
                ctaLabel="View"
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Breadcrumb({ name }: { name: string }) {
  return (
    <div className="text-sm text-brand-neutral-200 flex items-center gap-1">
      <Link
        href="/examples"
        className="hover:text-brand-white text-brand-neutral-100"
      >
        Templates
      </Link>
      <span className="text-brand-neutral-100">
        <Icons.arrowDown className="w-4 h-4 -rotate-90" />
      </span>
      <span className="text-brand-white">{name}</span>
    </div>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-brand-neutral-400">
        {label}
      </p>
      <div className="text-sm text-brand-white leading-relaxed">{children}</div>
    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M18.901 2H21.998L14.983 10.016L23.234 22H16.773L11.715 14.746L5.369 22H2.27L9.775 13.425L1.859 2H8.484L13.056 8.693L18.901 2ZM17.814 20.027H19.53L7.552 3.87H5.711L17.814 20.027Z" />
    </svg>
  );
}
