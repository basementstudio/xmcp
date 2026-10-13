import { Metadata } from "next";
import Link from "next/link";
import { FAQ_ITEMS } from "@/content/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { Icons } from "@/components/icons";
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
    <main id="main-content" className="site-page-grid">
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
      <div className="site-listing">
        <div className="listing-intro">
          <p className="eyebrow">A closer look / FAQ</p>
          <h1 className="display">Frequently asked questions</h1>
          <p className="listing-description">
            Everything you need to know about building and shipping MCP servers
            with xmcp. For the full reference, head to the{" "}
            <Link href="/docs" className="text-brand-white link-underline">
              documentation
            </Link>
            .
          </p>
        </div>

        {/* Native <details> rather than a JS accordion: the answers stay in the
            initial HTML for crawlers and answer engines, and the page needs no
            client bundle. The browser owns the open/close state — the shared
            `name` makes the group exclusive, and `.faq-item` in globals.css
            animates the reveal. */}
        <div className="site-stack">
          {FAQ_ITEMS.map((faq, index) => (
            <details
              key={faq.slug}
              id={faq.slug}
              name="faq"
              // First entry starts open so the page reads as answers rather
              // than a stack of closed labels.
              open={index === 0}
              className="faq-item bg-surface group p-4 rounded-lg border border-brand-neutral-500 scroll-mt-24"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <h2 className="text-brand-white text-sm font-medium text-balance">
                  {faq.question}
                </h2>
                <Icons.arrowDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-brand-neutral-100 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="text-brand-neutral-100 text-sm leading-[1.55] pt-2">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
