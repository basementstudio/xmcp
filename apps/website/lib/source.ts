import { docs, blog } from "@/.source";
import { loader } from "fumadocs-core/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});

export function getIntegrationPages() {
  return source
    .getPages()
    .filter((page) => page.url.startsWith("/docs/integrations/"))
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export const blogSource = loader({
  baseUrl: "/blog",
  source: blog.toFumadocsSource(),
});
