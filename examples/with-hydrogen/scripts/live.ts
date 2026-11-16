import { getProduct, searchProducts } from "../src/storefront.server";

// Queries the configured store (mock.shop by default) through the same
// helpers the MCP tools use.
const [first] = await searchProducts("", 1);
if (!first) throw new Error("The store returned no products");
console.log("search-products:", first.title, first.priceRange.minVariantPrice);

const product = await getProduct(first.handle);
console.log("get-product:", product?.title, product?.availableForSale);
