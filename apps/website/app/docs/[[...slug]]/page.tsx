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
import { getBaseUrl } from "@/lib/base-url";
import { getDocsMetadata } from "@/utils/docs";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      pageActions={<PageActions markdownUrl={`${page.url}.mdx`} />}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody className="border-t border-white/20 pt-4">
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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
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
