import { blogSource } from "@/lib/source";
import { DocsBody, DocsTitle } from "@/components/layout/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx-components";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { CodeBlock } from "@/components/codeblock";
import { BlogPage } from "@/components/layout/blog";
import { getBlogMetadata, resolveAuthors } from "@/utils/blog";
import { PostAuthors } from "@/components/blog/post-authors";
import { getBaseUrl } from "@/lib/base-url";

export default async function Page(props: PageProps<"/blog/[...slug]">) {
  const params = await props.params;
  const page = blogSource.getPage(params.slug);
  if (!page) notFound();

  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  const MDX = page.data.body;
  const authors = resolveAuthors(page.data.authors);

  return (
    <BlogPage toc={page.data.toc} slug={slug}>
      <div className="flex flex-col gap-4">
        {page.data.date && (
          <time
            dateTime={page.data.date}
            className="text-xs uppercase tracking-wide text-brand-neutral-50"
          >
            {new Date(page.data.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        )}
        <DocsTitle>{page.data.title}</DocsTitle>
        {page.data.description && (
          <p className="text-base text-brand-neutral-50 max-w-3xl pb-1">
            {page.data.description}
          </p>
        )}
        <PostAuthors authors={authors} />
      </div>
      <DocsBody className="w-full border-t border-white/20 pt-4">
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(blogSource, page),
            pre: ({ ref, ...props }) => (
              <CodeBlock ref={ref} {...props}>
                <pre>{props.children}</pre>
              </CodeBlock>
            ),
          })}
        />
      </DocsBody>
    </BlogPage>
  );
}

export async function generateStaticParams() {
  return blogSource.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/blog/[...slug]">
): Promise<Metadata> {
  const params = await props.params;
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  const baseUrl = getBaseUrl();
  const meta = getBlogMetadata(slug, baseUrl);
  if (!meta) notFound();

  const { title, description, ogImageUrl } = meta;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "xmcp",
      type: "article",
      locale: "en_US",
      images: {
        url: ogImageUrl,
        width: 1200,
        height: 630,
      },
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: {
        url: ogImageUrl,
        width: 1200,
        height: 630,
      },
    },
  };
}
