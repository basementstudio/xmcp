import {
  getLearnMarkdownFileBySlug,
  getLearnMarkdownFileSlugs,
} from "@/utils/markdown/learn-utils";
import { notFound } from "next/navigation";
import { CustomMDX } from "@/components/markdown/renderer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const slug = (await params).slug;
  const articleSlug = slug ? slug.join("/") : "index";

  const canonicalUrl =
    articleSlug === "index"
      ? "https://xmcp.dev/learn"
      : `https://xmcp.dev/learn/${articleSlug}`;

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const slug = (await params).slug;
  const articleSlug = slug ? slug.join("/") : "index";

  const article = getLearnMarkdownFileBySlug(articleSlug);

  if (!article) {
    notFound();
  }

  return (
    <div className="flex gap-8 w-full flex-col">
      <div className="flex-1 pt-10 px-4 lg:px-0 box-content">
        <article className="prose">
          <CustomMDX source={article.content} />
        </article>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  const files = getLearnMarkdownFileSlugs();

  return files.map((file) => ({
    slug: file.slug === "index" ? [] : file.slug.split("/"),
  }));
}
