import { source } from "../../../lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/components/layout/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx-components";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { PageActions } from "@/components/page-actions";
import { CodeBlock } from "@/components/codeblock";
import { getBaseUrl, SITE_URL } from "@/lib/base-url";
import { getDocsMetadata } from "@/utils/docs";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getBreadcrumbSchema,
  getTechArticleSchema,
  type BreadcrumbItem,
} from "@/lib/structured-data";

const titleize = (segment: string): string =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const displayTitle =
    (page.data as { displayTitle?: string })?.displayTitle || page.data.title;

  const meta = getDocsMetadata(params.slug, SITE_URL);
  const slugSegments = params.slug ?? [];
  const crumbs: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Docs", url: "/docs" },
    ...slugSegments.map((_, index) => ({
      name:
        index === slugSegments.length - 1
          ? displayTitle
          : titleize(slugSegments[index]),
      url: `/docs/${slugSegments.slice(0, index + 1).join("/")}`,
    })),
  ];
  const structuredData = [
    ...(meta ? [getTechArticleSchema(meta, params.slug, SITE_URL)] : []),
    getBreadcrumbSchema(crumbs, SITE_URL),
  ];

  return (
    <DocsPage
      toc={page.data.toc}
      pageActions={<PageActions markdownUrl={`${page.url}.md`} />}
    >
      <JsonLd data={structuredData} />
      <DocsTitle>{displayTitle}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody className="border-t border-white/20 pt-4">
        <blockquote className="sr-only">
          For the complete documentation index, see{" "}
          <a href="/llms.txt">llms.txt</a>. Markdown variants of every page are
          available by appending <code>.md</code> to the URL.
        </blockquote>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
            pre: ({ ref, ...props }) => (
              <CodeBlock ref={ref} {...props}>
                <pre>{props.children}</pre>
              </CodeBlock>
            ),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params;
  const baseUrl = getBaseUrl();
  const meta = getDocsMetadata(params.slug, baseUrl);
  if (!meta) notFound();

  const title = meta.title + " | xmcp Documentation";
  const description = meta.summary ?? meta.description;
  const slugPath = params.slug?.join("/") ?? "";
  const canonical = slugPath ? `${SITE_URL}/docs/${slugPath}` : `${SITE_URL}/docs`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "xmcp",
      type: "article",
      locale: "en_US",
      images: {
        url: meta.ogImageUrl,
        width: 1200,
        height: 630,
      },
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: {
        url: meta.ogImageUrl,
        width: 1200,
        height: 630,
      },
    },
  };
}
