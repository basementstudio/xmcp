import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { visit } from "unist-util-visit";
import type { Root } from "hast";

function safeUrl(value: unknown, baseUrl: string, image = false) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value, baseUrl);
    return ["https:", "http:", ...(image ? [] : ["mailto:"])].includes(
      url.protocol
    )
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export async function renderReleaseNotes(source: string, baseUrl: string) {
  const processor = remark().use(remarkGfm).use(remarkRehype);
  // Plain Markdown only: remark-rehype discards raw HTML, and no MDX is evaluated.
  const tree = (await processor.run(processor.parse(source))) as Root;
  let firstHeadingLevel = 6;
  visit(tree, "element", (node) => {
    if (/^h[1-6]$/.test(node.tagName)) {
      firstHeadingLevel = Math.min(firstHeadingLevel, Number(node.tagName[1]));
    }
  });
  visit(tree, "element", (node) => {
    if (node.tagName === "a") {
      node.properties.href = safeUrl(node.properties.href, baseUrl);
    }
    if (node.tagName === "img") {
      node.properties.src = safeUrl(node.properties.src, baseUrl, true);
      node.properties.loading = "lazy";
      node.properties.alt ??= "";
    }
    // The page title and release versions own the first two heading levels.
    if (/^h[1-6]$/.test(node.tagName)) {
      node.tagName = `h${Math.min(6, Number(node.tagName[1]) - firstHeadingLevel + 3)}`;
    }
  });
  return toJsxRuntime(tree, { Fragment, jsx, jsxs, development: false });
}

export async function ReleaseNotes({
  source,
  url,
}: {
  source: string;
  url: string;
}) {
  return (
    <div className="prose max-w-none min-w-0 [&>:first-child]:mt-0 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-brand-neutral-500 [&_pre]:p-4 [&_table]:block [&_table]:overflow-x-auto">
      {await renderReleaseNotes(source, url)}
    </div>
  );
}
