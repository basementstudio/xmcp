import {
  createShopifyRequestContext,
  createStorefrontClient,
  defineShopifyI18n,
} from "@shopify/hydrogen";

const i18n = defineShopifyI18n({
  defaultLocale: { language: "EN", country: "US" },
});

/**
 * One server-only Storefront client factory for routes and MCP tools. Catalog
 * reads carry no buyer context: MCP credentials and cookies never reach Shopify.
 */
export function storefront(signal?: AbortSignal) {
  const requestContext = createShopifyRequestContext({
    request: { headers: new Headers(), signal },
    i18n,
  });
  const config = {
    storeDomain: process.env.PUBLIC_STORE_DOMAIN || "pets.mock.shop",
  };
  const privateStorefrontToken = process.env.PRIVATE_STOREFRONT_API_TOKEN;
  return privateStorefrontToken
    ? createStorefrontClient({
        type: "private_no_buyer_context",
        requestContext,
        config: { ...config, privateStorefrontToken },
      })
    : createStorefrontClient({ type: "public", requestContext, config });
}

export async function searchProducts(
  query: string,
  first: number,
  signal?: AbortSignal
) {
  const result = await storefront(signal).graphql(
    `query Products($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        nodes {
          id
          handle
          title
          availableForSale
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }`,
    { variables: { query, first }, signal }
  );
  if (result.errors) throw new Error("Storefront product search failed");
  return result.data.products.nodes;
}

export async function getProduct(handle: string, signal?: AbortSignal) {
  const result = await storefront(signal).graphql(
    `query Product($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        description
        availableForSale
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }`,
    { variables: { handle }, signal }
  );
  if (result.errors) throw new Error("Storefront product lookup failed");
  return result.data.product;
}
