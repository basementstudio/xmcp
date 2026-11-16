import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { searchProducts } from "../../src/storefront.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return { products: await searchProducts("", 5, request.signal) };
}

export default function Home() {
  const { products } = useLoaderData<typeof loader>();
  return (
    <main>
      <h1>Store catalog</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.title} — {product.priceRange.minVariantPrice.amount}{" "}
            {product.priceRange.minVariantPrice.currencyCode}
          </li>
        ))}
      </ul>
    </main>
  );
}
