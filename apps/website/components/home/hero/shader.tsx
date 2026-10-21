import { HeroSlot } from "./persistent-hero";
import { ProductMock } from "./product-mock";

export default function Shader() {
  return (
    <figure className="hero-specimen">
      <HeroSlot />
      <ProductMock />
    </figure>
  );
}
