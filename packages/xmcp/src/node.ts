import { readFile } from "node:fs/promises";
import { audio, embeddedResource, image } from "./runtime/utils/content";

/** Read an image file as an MCP content block. The MIME type is explicit. */
export async function imageFromFile(path: string | URL, mimeType: string) {
  return image(await readFile(path), mimeType);
}

/** Read an audio file as an MCP content block. The MIME type is explicit. */
export async function audioFromFile(path: string | URL, mimeType: string) {
  return audio(await readFile(path), mimeType);
}

/** Read a file into a base64 resource blob with the supplied resource URI. */
export async function embeddedResourceFromFile(
  path: string | URL,
  uri: string,
  mimeType?: string
) {
  return embeddedResource(uri, await readFile(path), mimeType);
}
