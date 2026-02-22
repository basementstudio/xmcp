import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ExampleCard } from "@/components/examples/cards/cards";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { getBaseUrl } from "@/lib/base-url";
import {
  BRANCH,
  ExampleItem,
  fetchExample,
  fetchExampleReadme,
  fetchExamples,
} from "@/app/examples/utils/github";
import { Icons } from "@/components/icons";
import { getMDXComponents } from "@/components/mdx-components";
import { CodeBlock } from "@/components/codeblock";

type PageParams = {
  slug: string;
};

const baseUrl = getBaseUrl();

const resolvePreviewUrl = (example: ExampleItem) =>
  example.previewUrl ||
  (example.preview
    ? `https://raw.githubusercontent.com/xmcp-dev/templates/${BRANCH}/${example.preview}`
    : undefined);

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

  // Drop any immediate blank lines after removing the heading
  while (first < lines.length && lines[first].trim().length === 0) {
    lines.splice(first, 1);
  }

  return lines.join("\n");
}

function buildVercelCloneUrl(example: ExampleItem) {
  const folderPath = example.path?.replace(/^\/+/, "");

  // Build a Vercel clone URL that keeps the repo + branch and points to the template folder
  try {
    const url = new URL(example.repositoryUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const treeIndex = parts.indexOf("tree");

    // Expect /:owner/:repo/tree/:branch[/...folder]
    if (treeIndex === -1 || treeIndex + 1 >= parts.length) {
      throw new Error("Unexpected repositoryUrl format");
    }

    const owner = parts[0];
    const repo = parts[1];

    const repoWithBranch = `https://github.com/${owner}/${repo}/tree/main/${folderPath}`;
    const search = new URLSearchParams({
      "repository-url": repoWithBranch,
    });

    return `https://vercel.com/new/clone?${search.toString()}`;
  } catch (error) {
    console.error("Failed to build Vercel clone URL", error);
    const search = new URLSearchParams({
      "repository-url": example.repositoryUrl,
    });
    if (folderPath) {
      search.set("project-path", folderPath);
    }
    return `https://vercel.com/new/clone?${search.toString()}`;
  }
}

export async function generateStaticParams() {
  const examples = await fetchExamples();
  return examples.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const example = await fetchExample(params.slug);

  if (!example) {
    return {
      title: "Example not found - xmcp",
      description: "The requested example could not be found.",
    };
  }

  const canonical = `${baseUrl}/examples/${params.slug}`;
  const preview = resolvePreviewUrl(example);

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
      images: preview
        ? [
            {
              url: preview,
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
      images: preview ? [preview] : undefined,
    },
  };
}

export default async function ExampleDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const [example, examples] = await Promise.all([
    fetchExample(params.slug),
    fetchExamples(),
  ]);

  if (!example) {
    notFound();
  }

  const [readmeContent, previewUrl] = await Promise.all([
    fetchExampleReadme(example),
    Promise.resolve(resolvePreviewUrl(example)),
  ]);

  const moreExamples = examples
    .filter((item) => item.slug !== example.slug)
    .slice(0, 3);

  const fallbackReadme = `# README not found

Add a README.md to this template to show content here.`;
  const bodyContent = stripLeadingHeading(readmeContent ?? fallbackReadme);
  const vercelCloneUrl = buildVercelCloneUrl(example);

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
          {example.deployUrl && (
            <Button asChild variant="secondary">
              <Link
                href={example.deployUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Deploy
              </Link>
            </Button>
          )}

          <Button asChild variant="primary">
            <Link
              href={vercelCloneUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Deploy to Vercel
            </Link>
          </Button>
          <Button asChild variant="primary">
            <Link
              href={example.demoUrl || example.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Demo
            </Link>
          </Button>
        </div>
      </header>

      {previewUrl && (
        <div className="relative w-full overflow-hidden rounded-xs border border-brand-neutral-500">
          <div className="aspect-video relative">
            <Image
              src={previewUrl}
              alt={`${example.name} preview`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-8">
          <InfoCard label="GitHub Repo">
            <Link
              href={example.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-white text-brand-neutral-50 underline underline-offset-2"
            >
              {example.repositoryUrl.replace("https://github.com/", "")}
            </Link>
          </InfoCard>

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

          {(example.category || example.tags?.length) && (
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
            <div className="flex gap-2">
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="min-w-[100px]"
              >
                <Link
                  href={example.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Github
                </Link>
              </Button>
              {example.demoUrl && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="min-w-[100px]"
                >
                  <Link
                    href={example.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Demo
                  </Link>
                </Button>
              )}
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
            More templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moreExamples.map((item) => (
              <ExampleCard
                key={item.slug}
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
