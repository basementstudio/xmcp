// source.config.ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import {
  rehypeCode,
  rehypeCodeDefaultOptions
} from "fumadocs-core/mdx-plugins";
var docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true
    }
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      lazy: true,
      experimentalJSEngine: true,
      langs: ["ts", "js", "html", "tsx", "jsx", "json", "mdx", "bash", "shell"],
      inline: "tailing-curly-colon",
      themes: {
        light: "ayu-dark",
        dark: "ayu-dark"
      },
      transformers: [...rehypeCodeDefaultOptions.transformers ?? []]
    },
    rehypePlugins: [rehypeCode]
  }
});
export {
  source_config_default as default,
  docs
};
