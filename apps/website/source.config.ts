import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import {
  rehypeCode,
  rehypeCodeDefaultOptions,
} from "fumadocs-core/mdx-plugins";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

export const blog = defineDocs({
  dir: "content/blog",
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      lazy: true,
      experimentalJSEngine: true,
      langs: ["ts", "js", "html", "tsx", "jsx", "json", "mdx", "bash", "shell"],
      inline: "tailing-curly-colon",
      themes: {
        light: "ayu-dark",
        dark: "ayu-dark",
      },
      transformers: [...(rehypeCodeDefaultOptions.transformers ?? [])],
    },
    rehypePlugins: [rehypeCode],
  },
});
