import { DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/social-image";
import { Metadata } from "next";
import Link from "next/link";
import { FAQ_ITEMS } from "@/content/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { AccordionItem } from "@/components/ui/accordion-item";
import { getBreadcrumbSchema, getFaqSchema } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/base-url";

export const dynamic = "force-static";

const TITLE = "MCP and xmcp FAQ: Setup, Clients, Auth, and Deployment";
const DESCRIPTION =
  "Answers to common questions about xmcp: what it is, how to create a project, tools, resources and prompts, transports, framework adapters, authentication, deployment, and monetization.";

const FAQ_URL = `${SITE_URL}/faq`;

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
    images: DEFAULT_OG_IMAGE,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: DEFAULT_TWITTER_IMAGE,
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

        <div className="site-accordion">
          {FAQ_ITEMS.map((faq, index) => (
            <AccordionItem
              key={faq.slug}
              id={faq.slug}
              name="faq"
              index={index + 1}
              title={<h2>{faq.question}</h2>}
              // First entry starts open so the page reads as answers rather
              // than a stack of closed labels.
              open={index === 0}
              className="scroll-mt-24"
            >
              <p className="site-accordion-answer">{faq.answer}</p>
            </AccordionItem>
          ))}
        </div>
      </div>
    </main>
  );
}
