import { HeroSlot } from "./persistent-hero";
import { ProductMock } from "./dashboard-player";

export default function Shader() {
  return (
    <figure className="hero-specimen">
      <HeroSlot />
      <ProductMock />
    </figure>
  );
}
