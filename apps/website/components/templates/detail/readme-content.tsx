import { MDXRemote } from "next-mdx-remote/rsc";
import { Children, type ComponentProps, type ReactElement } from "react";
import { highlight } from "fumadocs-core/highlight";
import type { BundledLanguage } from "shiki";
import { getMDXComponents } from "@/components/mdx-components";
import { CodeBlock } from "@/components/codeblock";
import { xmcpAyuDarkTheme } from "@/lib/shiki-theme";

const BROKEN_INTERNAL_LINK_RE = /\/docs\/integrations\/chatgpt\b/;

function stripBrokenInternalLinks(source: string): string {
  // Replace markdown links pointing at the removed /docs/integrations/chatgpt
  // route with their link text so they stop generating 404 hits. Matches both
  // inline links [text](url) and reference-style [text]: url.
  const inlineReplaced = source.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text: string, url: string) =>
      BROKEN_INTERNAL_LINK_RE.test(url) ? text : match
  );
  return inlineReplaced.replace(
    /^\s{0,3}\[([^\]]+)\]:\s+(.+)$/gm,
    (match, _, url: string) =>
      BROKEN_INTERNAL_LINK_RE.test(url) ? "" : match
  );
}

async function renderHighlightedCodeBlock(code: string, lang: string) {
  try {
    return await highlight(code, {
      lang: lang as BundledLanguage,
      theme: xmcpAyuDarkTheme,
      components: {
        pre: ({ ref, ...props }) => (
          <CodeBlock ref={ref} data-line-numbers {...props}>
            <pre className="!text-[12px] [&_*]:!text-[12px]">
              {props.children}
            </pre>
          </CodeBlock>
        ),
      },
    });
  } catch {
    return await highlight(code, {
      lang: "plaintext",
      theme: xmcpAyuDarkTheme,
      components: {
        pre: ({ ref, ...props }) => (
          <CodeBlock ref={ref} data-line-numbers {...props}>
            <pre className="!text-[12px] [&_*]:!text-[12px]">
              {props.children}
            </pre>
          </CodeBlock>
        ),
      },
    });
  }
}

async function ReadmePre(props: ComponentProps<"pre">) {
  const code = Children.only(props.children) as ReactElement;
  const codeProps = code.props as ComponentProps<"code">;
  const content = codeProps.children;

  if (typeof content !== "string") {
    return (
      <CodeBlock>
        <pre>{props.children}</pre>
      </CodeBlock>
    );
  }

  let lang =
    codeProps.className
      ?.split(" ")
      .find((value) => value.startsWith("language-"))
      ?.slice("language-".length) ?? "text";

  if (lang === "mdx") lang = "md";

  return renderHighlightedCodeBlock(content.trimEnd(), lang);
}

function ReadmeImg(props: ComponentProps<"img">) {
  const { src } = props;
  if (!src || typeof src !== "string") return null;
  const isRemote = /^https?:\/\//i.test(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={src}
      loading="lazy"
      referrerPolicy={isRemote ? "no-referrer" : undefined}
      className="inline-block max-w-full h-auto rounded-xs"
    />
  );
}

export function TemplateReadmeContent({ source }: { source: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <MDXRemote
        source={stripBrokenInternalLinks(source)}
        components={getMDXComponents({
          pre: ReadmePre,
          img: ReadmeImg as never,
        })}
      />
    </div>
  );
}
