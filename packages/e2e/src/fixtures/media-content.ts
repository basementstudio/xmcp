export const MEDIA_CONTENT_FILES = {
  "src/tools/media-content.ts": `import { image, audio, embeddedResource } from "xmcp";
export const metadata = { name: "media-content", description: "Return mixed media content" };
export default function mediaContent() {
  const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="), (char) => char.charCodeAt(0));
  return { content: [
    { type: "text", text: "A pixel and its description" },
    image(png, "image/png"),
    audio(new Uint8Array([0, 255]), "audio/wav"),
    embeddedResource("note://pixel", "One pixel", "text/plain"),
    embeddedResource("data://bytes", new Uint8Array([0, 255]), "application/octet-stream"),
  ] };
}
`,
};
