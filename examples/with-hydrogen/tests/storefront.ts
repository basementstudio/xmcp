import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { TestContext } from "node:test";

export const product = {
  id: "gid://shopify/Product/1",
  handle: "dog-bed",
  title: "Dog bed",
  description: "A soft bed.",
  availableForSale: true,
  priceRange: { minVariantPrice: { amount: "49.0", currencyCode: "USD" } },
};

/**
 * A Storefront API stand-in. It records each GraphQL request and answers
 * from a single fixture product; the `broken` handle returns a GraphQL error.
 */
export async function fakeStorefront(context: TestContext) {
  const requests: {
    url?: string;
    headers: Record<string, unknown>;
    body: any;
  }[] = [];
  const server = createServer(async (request, response) => {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    requests.push({ url: request.url, headers: request.headers, body });
    const handle = body.variables?.handle;
    const data =
      handle === "broken"
        ? { errors: [{ message: "Internal secret" }] }
        : handle !== undefined
          ? { data: { product: handle === product.handle ? product : null } }
          : { data: { products: { nodes: [product] } } };
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(data));
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => server.close());
  const { port } = server.address() as AddressInfo;
  return { domain: `http://127.0.0.1:${port}`, requests };
}
