import { MDXRemote } from "next-mdx-remote/rsc";
import { Children, type ComponentProps, type ReactElement } from "react";
import { highlight } from "fumadocs-core/highlight";
import type { BundledLanguage } from "shiki";
import { getMDXComponents } from "@/components/mdx-components";
import { CodeBlock } from "@/components/codeblock";
import { xmcpAyuDarkTheme } from "@/lib/shiki-theme";

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

export function ExampleReadmeContent({ source }: { source: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <MDXRemote
        source={source}
        components={getMDXComponents({
          pre: ReadmePre,
        })}
      />
    </div>
  );
}
