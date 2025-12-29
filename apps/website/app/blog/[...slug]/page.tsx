import { blogSource } from "../../../lib/source";
import { DocsBody } from "@/components/layout/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx-components";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { CodeBlock } from "@/components/codeblock";
import { BlogPage } from "@/components/layout/blog";
import {
  getBlogMetadata,
  getBlogPostBySlug,
  resolveAuthors,
} from "@/utils/blog";
import { getBaseUrl } from "@/lib/base-url";
import { PostAuthors } from "@/components/blog/post-authors";
import { PostMeta } from "@/components/blog/post-meta";
import { DocsTitle } from "@/components/layout/page";

export default async function Page(props: PageProps<"/blog/[...slug]">) {
  const params = await props.params;
  const page = blogSource.getPage(params.slug);
  if (!page) notFound();

  const slug = Array.isArray(params.slug) ? params.slug.join("/") : params.slug;
  const post = getBlogPostBySlug(slug);
  const MDX = page.data.body;
  const authors = resolveAuthors(page.data.authors);
  const words = post ? post.content.split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMinutes =
    words > 0 ? Math.max(1, Math.round(words / 200)) : null;
  const shareUrl = `${getBaseUrl()}/blog/${slug}`;

  return (
    <BlogPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description && (
        <p className="text-base text-brand-neutral-50 max-w-3xl">
          {page.data.description}
        </p>
      )}
      <PostAuthors authors={authors} />
      <PostMeta
        readingTimeMinutes={readingTimeMinutes}
        shareUrl={shareUrl}
        date={page.data.date}
      />
      <DocsBody className="w-full">
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
