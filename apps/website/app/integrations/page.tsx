import type { Metadata } from "next";
import Link from "next/link";
import { getIntegrationPages } from "@/lib/source";
import { IntegrationList } from "@/components/integration-list";
import { SITE_URL } from "@/lib/base-url";
import { JsonLd } from "@/components/seo/json-ld";
import { getBreadcrumbSchema } from "@/lib/structured-data";

const title = "MCP Server Integrations for TypeScript | xmcp";
const description =
  "Connect xmcp tools to authentication, payments, databases, design tools, and APIs with setup guides and runnable examples.";
export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${SITE_URL}/integrations`,
    types: { "text/markdown": `${SITE_URL}/integrations.md` },
  },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/integrations`,
    type: "website",
  },
  twitter: { title, description, card: "summary_large_image" },
};

export default function IntegrationsPage() {
  const pages = getIntegrationPages();
  return (
    <main id="main-content" className="site-page-grid">
      <JsonLd
        data={[
          getBreadcrumbSchema(
            [
              { name: "Home", url: "/" },
              { name: "Integrations", url: "/integrations" },
            ],
            SITE_URL
          ),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url: `${SITE_URL}/integrations`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: pages.map((page, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: page.data.title,
                url: `${SITE_URL}${page.url}`,
              })),
            },
          },
        ]}
      />
      <div className="site-listing">
        <div className="listing-intro">
          <p className="eyebrow">The connections / Integrations</p>
          <h1 className="display">Integrations</h1>
          <p className="listing-description">
            Connect your MCP server to the services your agents need. Choose an
            integration for authentication, billing, observability, or tools
            that call an external API. Each guide explains its requirements and
            links to implementation examples.
          </p>
          <p className="listing-description">
            Start with{" "}
            <Link
              className="underline"
              href="/docs/getting-started/installation"
            >
              installation
            </Link>{" "}
            if you do not have an xmcp project. For a complete starting project,
            browse the{" "}
            <Link className="underline" href="/templates">
              MCP server templates
            </Link>
            . Read the{" "}
            <Link className="underline" href="/docs/guides/authentication">
              authentication guide
            </Link>{" "}
            before exposing tools to remote clients.
          </p>
        </div>
        <IntegrationList />
      </div>
    </main>
  );
}
