"use client";

import Image from "next/image";
import ParticleImage from "@/components/particles/image";
import type { getBlogImageProps } from "@/lib/blog-images";
import { useHeroArtworkReady } from "@/components/home/hero/persistent-hero";

/** Keep the original optimized cover available before the shader is ready. */
export function BlogArtwork({
  image,
  alt,
  sizes,
  loading = "lazy",
  preload = false,
  prepareAfterHero = false,
}: {
  image: ReturnType<typeof getBlogImageProps>;
  alt: string;
  sizes: string;
  loading?: "eager" | "lazy";
  preload?: boolean;
  prepareAfterHero?: boolean;
}) {
  const heroReady = useHeroArtworkReady();
  const prepare = prepareAfterHero && heroReady;
  const texture =
    typeof image.src === "string"
      ? image.src
      : "default" in image.src
        ? image.src.default.src
        : image.src.src;

  return (
    <div className="absolute inset-0 bg-black" role="img" aria-label={alt}>
      <ParticleImage
        src={texture}
        width={1200}
        height={675}
        className="h-full w-full"
        preset="blog"
        fadeIn
        prepare={prepare}
        fallback={
          <Image
            {...image}
            alt=""
            fill
            sizes={sizes}
            preload={preload}
            loading={preload ? undefined : prepare ? "eager" : loading}
            className="object-cover"
          />
        }
      />
    </div>
  );
}
