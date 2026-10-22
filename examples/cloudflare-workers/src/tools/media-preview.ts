import { image, embeddedResource } from "xmcp/cloudflare";

export const metadata = {
  name: "media-preview",
  description: "Return a one-pixel PNG and an embedded description",
};

export default function mediaPreview() {
  const png = Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    ),
    (character) => character.charCodeAt(0)
  );
  return {
    content: [
      image(png, "image/png"),
      embeddedResource("note://pixel", "A one-pixel PNG", "text/plain"),
    ],
  };
}
