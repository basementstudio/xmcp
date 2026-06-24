import { FAQ_ITEMS } from "@/content/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { getFaqSchema, type FaqItem } from "@/lib/structured-data";

/**
 * Emits FAQPage structured data alongside the questions and answers as
 * visually-hidden DOM content. The text stays crawlable (it is `sr-only`, not
 * `display: none`) so the structured data has matching on-page content. Pass
 * `items` to reuse this on other pages, e.g. future unlinked "ghost" pages.
 */
export function FaqBlock({
  items = FAQ_ITEMS,
}: {
  items?: readonly FaqItem[];
}) {
  if (items.length === 0) return null;

  return (
    <>
      <JsonLd data={getFaqSchema(items)} />
      <section className="sr-only" aria-hidden="true">
        <h2>Frequently asked questions</h2>
        <dl>
          {items.map((faq) => (
            <div key={faq.question}>
              <dt>{faq.question}</dt>
              <dd>{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
