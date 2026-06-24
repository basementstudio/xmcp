/**
 * Renders a JSON-LD structured data script tag. Pass a single schema object or
 * an array of objects. The data is built server-side, so the only escaping
 * needed is "<" to avoid breaking out of the script context.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
