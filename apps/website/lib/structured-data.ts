import type { BlogPost } from "@/utils/blog";
import type { DocsMetadata } from "@/utils/docs";

const ORG_NAME = "xmcp";
const ORG_SAME_AS = [
  "https://github.com/basementstudio/xmcp",
  "https://x.com/xmcp_dev",
];

const absolute = (baseUrl: string, path: string): string =>
  new URL(path, baseUrl).toString();

const orgRef = (baseUrl: string) => ({
  "@type": "Organization",
  name: ORG_NAME,
  url: baseUrl,
});

export interface BreadcrumbItem {
  readonly name: string;
  readonly url: string;
}

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export function getOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: baseUrl,
    logo: absolute(baseUrl, "/favicon.svg"),
    sameAs: ORG_SAME_AS,
  };
}

export function getWebSiteSchema(baseUrl: string) {
  // The site search is a client-side dialog with no URL query endpoint, so we
  // intentionally omit a SearchAction (a sitelinks searchbox needs a crawlable
  // `?q=` target). Add `potentialAction` here if a search route is introduced.
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: baseUrl,
    publisher: orgRef(baseUrl),
  };
}

export function getBlogPostingSchema(post: BlogPost, baseUrl: string) {
  const url = absolute(baseUrl, `/blog/${post.slug}`);
  const image = post.previewImage
    ? absolute(baseUrl, post.previewImage)
    : absolute(baseUrl, `/api/og/blog/${post.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description ?? post.summary ?? "",
    image,
    url,
    mainEntityOfPage: url,
    ...(post.date ? { datePublished: post.date } : {}),
    author: post.authors.map((author) => ({
      "@type": "Person",
      name: author.name,
      url: author.xUrl,
      sameAs: author.xUrl,
    })),
    publisher: orgRef(baseUrl),
  };
}

export function getTechArticleSchema(
  meta: DocsMetadata,
  slug: string[] | undefined,
  baseUrl: string
) {
  const slugPath = slug?.join("/") ?? "";
  const url = absolute(baseUrl, `/docs/${slugPath}`);

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: meta.title,
    description: meta.summary ?? meta.description ?? "",
    image: meta.ogImageUrl,
    url,
    mainEntityOfPage: url,
    isPartOf: {
      "@type": "WebSite",
      name: `${ORG_NAME} Documentation`,
      url: absolute(baseUrl, "/docs"),
    },
    publisher: orgRef(baseUrl),
  };
}

export function getBreadcrumbSchema(
  items: BreadcrumbItem[],
  baseUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(baseUrl, item.url),
    })),
  };
}

export function getFaqSchema(faqs: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
