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
    <main
      id="main-content"
      className="max-w-[1200px] w-full mx-auto px-4 py-8 md:py-16"
    >
      <div className="max-w-[720px] mx-auto text-center mb-12 md:mb-20">
        <h1 className="display text-gradient">Changelog</h1>
        <p className="text-brand-neutral-100 text-base mt-4">{description}</p>
        <a
          href="https://github.com/basementstudio/xmcp/releases"
          className="inline-block text-sm text-brand-neutral-100 underline underline-offset-4 hover:text-brand-white mt-4"
        >
          All releases on GitHub ↗
        </a>
      </div>
      <div className="max-w-[960px] mx-auto">
        {releases.map((release) => (
          <article
            key={release.version}
            id={releaseAnchor(release.version)}
            aria-labelledby={`release-${release.version}`}
            className="grid md:grid-cols-[180px_minmax(0,1fr)] gap-6 md:gap-12 border-t border-brand-neutral-500 py-8 md:py-12"
          >
            <div>
              <h2
                id={`release-${release.version}`}
                className="text-xl font-mono text-brand-white"
              >
                <a
                  href={`#${releaseAnchor(release.version)}`}
                  className="hover:underline underline-offset-4"
                >
                  v{release.version}
                </a>
              </h2>
              <time
                dateTime={release.publishedAt}
                className="block text-sm text-brand-neutral-100 mt-2"
              >
                {formatReleaseDate(release.publishedAt)}
              </time>
              <a
                href={release.url}
                className="inline-block text-sm text-brand-neutral-100 underline underline-offset-4 hover:text-brand-white mt-4"
              >
                View on GitHub ↗
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
