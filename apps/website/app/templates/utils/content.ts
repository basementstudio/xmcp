import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { parseFrontmatter } from "../../../utils/frontmatter";

const text = z.string().trim().min(1);
const url = z.url({ protocol: /^https?$/ });
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const templateSchema = z.object({
  name: text,
  description: text,
  category: text.optional(),
  tags: z.array(text).default([]),
  sourceRepo: text.regex(/^[\w.-]+\/[\w.-]+$/).default("xmcp-dev/templates"),
  sourceBranch: text.default("main"),
  path: text.optional(),
  websiteUrl: url.optional(),
  demoUrl: url.optional(),
  deployUrl: url.optional(),
  replitUrl: url.optional(),
  previewUrl: text.optional(),
});

export type TemplateItem = z.infer<typeof templateSchema> & {
  slug: string;
  path: string;
  repositoryUrl: string;
  primaryFilterTag?: string;
  metadataKeywords: string[];
};

function readTemplate(slug: string) {
  if (!slugPattern.test(slug)) {
    throw new Error(`Invalid template slug: ${slug}`);
  }
  const file = path.join(process.cwd(), "content", "templates", `${slug}.md`);

  try {
    const { data, content } = parseFrontmatter(fs.readFileSync(file, "utf8"));
    const metadata = templateSchema.parse(data);
    if (!content.trim()) throw new Error("Template README must not be empty");

    if (metadata.previewUrl) {
      const publicDirectory = path.join(process.cwd(), "public");
      const previewFile = path.resolve(
        publicDirectory,
        `.${metadata.previewUrl}`
      );
      if (
        !metadata.previewUrl.startsWith("/") ||
        metadata.previewUrl.startsWith("//") ||
        !previewFile.startsWith(`${publicDirectory}${path.sep}`) ||
        !fs.existsSync(previewFile) ||
        !fs.statSync(previewFile).isFile()
      ) {
        throw new Error(
          "previewUrl must reference an existing image in public"
        );
      }
    }

    const templatePath = metadata.path ?? slug;
    const tags = Array.from(new Set(metadata.tags));
    const template: TemplateItem = {
      ...metadata,
      slug,
      path: templatePath,
      tags,
      repositoryUrl: `https://github.com/${metadata.sourceRepo}/tree/${metadata.sourceBranch}/${templatePath}`,
      primaryFilterTag: metadata.category ?? tags[0],
      metadataKeywords: Array.from(
        new Set([...(metadata.category ? [metadata.category] : []), ...tags])
      ),
    };
    return { template, content };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid template content in ${file}: ${message}`);
  }
}

export function getTemplates(): TemplateItem[] {
  const directory = path.join(process.cwd(), "content", "templates");
  const slugs = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.slice(0, -3))
    .sort();
  if (slugs.length === 0)
    throw new Error(`No template content in ${directory}`);

  // Keep README bodies out of the catalog sent to the client-side listing.
  return slugs.map((slug) => readTemplate(slug).template);
}

export function getTemplateBySlug(slug: string): TemplateItem | null {
  return getTemplates().find((item) => item.slug === slug) ?? null;
}

export function getTemplateReadme(template: TemplateItem): string {
  return readTemplate(template.slug).content;
}
