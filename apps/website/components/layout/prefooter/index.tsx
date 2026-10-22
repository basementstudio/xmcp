import ParticleImage from "@/components/particles/image";

export const PrefooterArtwork = () => (
  <div className="prefooter-artwork" aria-hidden="true">
    <div className="prefooter-particles">
      <ParticleImage
        src="/x.webp"
        width={176}
        height={212}
        className="w-[127px] h-[154px]"
        preset="footer"
      />
    </div>
  </div>
);

export const Prefooter = () => (
  <section className="site-prefooter" aria-labelledby="prefooter-title">
    <PrefooterArtwork />
    <h2 id="prefooter-title" className="site-page-title">
      One framework to rule them all
    </h2>
  </section>
);
