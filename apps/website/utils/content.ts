import fs from "fs";
import path from "path";
import { z } from "zod";
import { parseFrontmatter } from "@/utils/frontmatter";

const PUBLIC_DIRECTORY = path.join(process.cwd(), "public");
const text = z.string().trim().min(1);
const localImage = text.refine((value) => {
  if (!value.startsWith("/") || value.startsWith("//")) return false;

  const file = path.resolve(PUBLIC_DIRECTORY, `.${value}`);
  return (
    file.startsWith(`${PUBLIC_DIRECTORY}${path.sep}`) &&
    fs.existsSync(file) &&
    fs.statSync(file).isFile()
  );
}, "Must reference an existing image in public using a path starting with /");

const cardSchema = z.object({
  name: text,
  tagline: text,
  logo: localImage,
  order: z.number().int().optional(),
});

const testimonialSchema = cardSchema.extend({
  handle: text,
  position: text.optional(),
  logo: localImage.optional(),
});

const showcaseSchema = cardSchema.extend({
  connection: text,
  repositoryUrl: z.url({ protocol: /^https?$/ }).optional(),
  tag: text.optional(),
});

export type Testimonial = z.infer<typeof testimonialSchema>;
export type ShowcaseItem = z.infer<typeof showcaseSchema>;

function readCards<T extends { order?: number }>(
  collection: "testimonials" | "showcase",
  schema: z.ZodType<T>
): (T & { slug: string })[] {
  const directory = path.join(process.cwd(), "content", collection);

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const file = path.join(directory, entry.name);

      try {
        const { data, content } = parseFrontmatter(
          fs.readFileSync(file, "utf8")
        );
        return {
          ...schema.parse({ ...data, tagline: content.trim() }),
          slug: entry.name.slice(0, -3),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid content in ${file}: ${message}`);
      }
    })
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER) || a.slug.localeCompare(b.slug)
    );
}

export function getTestimonials() {
  return readCards("testimonials", testimonialSchema);
}

export function getShowcaseItems() {
  return readCards("showcase", showcaseSchema);
}
