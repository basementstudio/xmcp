import assert from "node:assert/strict";
import { test } from "node:test";
import { getProduct, searchProducts } from "../src/storefront.server";
import { fakeStorefront, product } from "./storefront";

test("queries the Storefront API without forwarding caller credentials", async (context) => {
  const storefront = await fakeStorefront(context);
  process.env.PUBLIC_STORE_DOMAIN = storefront.domain;
  delete process.env.PRIVATE_STOREFRONT_API_TOKEN;

  assert.deepEqual(await searchProducts("bed", 3), [product]);
  assert.deepEqual(storefront.requests[0].body.variables, {
    query: "bed",
    first: 3,
  });
  assert.match(storefront.requests[0].url!, /^\/api\/[^/]+\/graphql\.json$/);
  assert.equal(storefront.requests[0].headers.authorization, undefined);
  assert.equal(storefront.requests[0].headers.cookie, undefined);

  assert.deepEqual(await getProduct("dog-bed"), product);
  assert.equal(await getProduct("missing"), null);
  await assert.rejects(getProduct("broken"), {
    message: "Storefront product lookup failed",
  });
});

test("uses the private token server-side when configured", async (context) => {
  const storefront = await fakeStorefront(context);
  process.env.PUBLIC_STORE_DOMAIN = storefront.domain;
  process.env.PRIVATE_STOREFRONT_API_TOKEN = "private-token";
  try {
    await searchProducts("bed", 1);
    assert.equal(
      storefront.requests[0].headers["shopify-storefront-private-token"],
      "private-token"
    );
  } finally {
    delete process.env.PRIVATE_STOREFRONT_API_TOKEN;
  }
});
