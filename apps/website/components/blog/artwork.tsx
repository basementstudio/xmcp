import Image from "next/image";
import ParticleImage from "@/components/particles/image";
import { getBlogImageProps } from "@/lib/blog-images";

/** Keep the original optimized cover available before the shader is ready. */
export function BlogArtwork({
  src,
  alt,
  sizes,
  loading = "lazy",
  preload = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  loading?: "eager" | "lazy";
  preload?: boolean;
}) {
  const image = getBlogImageProps(src);
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
        fallback={
          <Image
            {...image}
            alt=""
            fill
            sizes={sizes}
            preload={preload}
            loading={preload ? undefined : loading}
            className="object-cover"
          />
        }
      />
    </div>
  );
}
