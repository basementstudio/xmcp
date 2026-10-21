import type { Metadata } from "next";
import { ReleaseNotes } from "@/components/changelog/release-notes";
import { SITE_URL } from "@/lib/base-url";
import { formatReleaseDate, getReleases, releaseAnchor } from "@/lib/releases";

export const dynamic = "force-static";
export const revalidate = false;

const title = "xmcp Changelog";
const description =
  "New features, improvements, and fixes in every stable xmcp release.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: `${SITE_URL}/changelog`,
    types: { "text/markdown": `${SITE_URL}/changelog.md` },
  },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/changelog`,
    type: "website",
    images: "/xmcp-og.png",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: "/xmcp-og.png",
  },
};

export default function ChangelogPage() {
  const releases = getReleases();
  return (
    <main id="main-content" className="site-page-grid site-page-stack">
      <div className="listing-intro">
        <p className="eyebrow">The release log / Changelog</p>
        <h1 className="display">Changelog</h1>
        <p className="site-description mt-4">{description}</p>
        <a
          href="https://github.com/basementstudio/xmcp/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-brand-neutral-100 link-underline hover:text-brand-white mt-4"
        >
          All releases on GitHub ↗
        </a>
      </div>
      <div className="site-stack">
        {releases.map((release) => (
          <article
            key={release.version}
            id={releaseAnchor(release.version)}
            aria-labelledby={`release-${release.version}`}
            className="site-release"
          >
            <div className="site-release-meta">
              <h2
                id={`release-${release.version}`}
                className="site-section-title"
              >
                <a
                  href={`#${releaseAnchor(release.version)}`}
                  className="link-underline"
                  aria-label={`Version ${release.version}`}
                  title={`v${release.version}`}
                >
                  v{release.version}
                </a>
              </h2>
              <time
                dateTime={release.publishedAt}
                className="site-release-date"
              >
                {formatReleaseDate(release.publishedAt)}
              </time>
              <a
                href={release.url}
                target="_blank"
                rel="noopener noreferrer"
                className="site-release-link link-underline"
              >
                GitHub ↗
              </a>
            </div>
            {release.body.trim() ? (
              <ReleaseNotes source={release.body} url={release.url} />
            ) : (
              <p className="text-brand-neutral-100">
                No release notes provided.
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
