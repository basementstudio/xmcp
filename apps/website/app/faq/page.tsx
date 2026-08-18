import { Metadata } from "next";
import Link from "next/link";
import { FAQ_ITEMS } from "@/content/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { getBreadcrumbSchema, getFaqSchema } from "@/lib/structured-data";
import { getBaseUrl, SITE_URL } from "@/lib/base-url";

export const dynamic = "force-static";

const TITLE = "FAQ - xmcp";
const DESCRIPTION =
  "Answers to common questions about xmcp: what it is, how to create a project, tools, resources and prompts, transports, framework adapters, authentication, deployment, and monetization.";

const FAQ_URL = `${SITE_URL}/faq`;
const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: FAQ_URL,
    types: {
      "text/markdown": `${SITE_URL}/faq.md`,
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: FAQ_URL,
    siteName: "xmcp",
    type: "website",
    locale: "en_US",
    images: {
      url: `${baseUrl}/xmcp-og.png`,
      width: 1200,
      height: 630,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: {
      url: `${baseUrl}/xmcp-og.png`,
      width: 1200,
      height: 630,
    },
  },
};

export default function FaqPage() {
  return (
    <main className="grid grid-cols-12 gap-[20px] max-w-[1200px] w-full mx-auto px-4">
      <JsonLd
        data={[
          getFaqSchema(FAQ_ITEMS, FAQ_URL),
          getBreadcrumbSchema(
            [
              { name: "Home", url: "/" },
              { name: "FAQ", url: "/faq" },
            ],
            SITE_URL
          ),
        ]}
      />
      <div className="col-span-12 grid grid-cols-12 gap-[20px] py-8 md:py-16">
        <div className="flex flex-col items-center justify-center max-w-[720px] w-full mx-auto gap-4 col-span-12 mb-8">
          <h1 className="display text-center text-balance z-10 text-gradient">
            Frequently asked questions
          </h1>
          <p className="text-brand-neutral-100 text-base max-w-[650px] text-center">
            Everything you need to know about building and shipping MCP servers
            with xmcp. For the full reference, head to the{" "}
            <Link
              href="/docs"
              className="text-brand-white underline underline-offset-4"
            >
              documentation
            </Link>
            .
          </p>
        </div>

        {/* Plain, always-expanded markup: every answer is in the initial HTML,
            so crawlers and answer engines read it without running JS. */}
        <dl className="col-span-12 lg:col-span-10 lg:col-start-2 flex flex-col gap-[20px]">
          {FAQ_ITEMS.map((faq) => (
            <div
              key={faq.slug}
              id={faq.slug}
              className="flex flex-col gap-2 p-4 rounded-xs border border-brand-neutral-500 scroll-mt-24"
            >
              <dt className="text-brand-white text-lg text-balance">
                {faq.question}
              </dt>
              <dd className="text-brand-neutral-100 body-l">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
