import {
  defineDocs,
  defineConfig,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import { z } from "zod";
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
    schema: frontmatterSchema.extend({
      displayTitle: z.string().optional(),
    }),
  },
});

export const blog = defineDocs({
  dir: "content/blog",
  docs: {
    schema: frontmatterSchema.extend({
      category: z.string().optional(),
      order: z.number().optional(),
      featured: z.boolean().optional(),
      previewImage: z.string().optional(),
      textureImage: z.string().optional(),
      authors: z.array(z.string()).optional(),
      date: z.string().optional(),
      summary: z.string().optional(),
    }),
  },
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
