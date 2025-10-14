import { blogSource } from "../../../lib/source";
import { DocsBody, DocsDescription, DocsTitle } from "@/components/layout/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx-components";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { CodeBlock } from "@/components/codeblock";
import { BlogPage } from "@/components/layout/blog";

export default async function Page(props: PageProps<"/blog/[...slug]">) {
  const params = await props.params;
  const page = blogSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <BlogPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
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
  const page = blogSource.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title + " | xmcp Blog",
    description: page.data.description,
    /*     openGraph: {
      images: getPageImage(page).url,
    }, */
  };
}
