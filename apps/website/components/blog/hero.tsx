import Link from "next/link";
import Image from "next/image";
import { type BlogPost } from "../../utils/blog";
import { Tag } from "../ui/tag";
import { getBlogImageProps } from "@/lib/blog-images";

interface BlogHeroProps {
  featuredPost: BlogPost;
}

export function BlogHero({ featuredPost }: BlogHeroProps) {
  const image = featuredPost.previewImage || featuredPost.textureImage;

  return (
    <Link href={`/blog/${featuredPost.slug}`} className="block col-span-12">
      <section className="relative group overflow-visible">
        <div className="site-card-surface relative overflow-hidden w-full flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 md:border-r border-brand-neutral-500 overflow-hidden group-hover:border-brand-neutral-300 transition-colors duration-200 relative aspect-video">
            {image ? (
              <Image
                {...getBlogImageProps(image)}
                alt={featuredPost.title}
                fill
                sizes="(min-width: 768px) 350px, (min-width: 740px) 700px, calc(100vw - 40px)"
                preload
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-neutral-200 text-sm">
                No preview image
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Tag text="FEATURED" />
                <Tag text={featuredPost.category} />
              </div>
              {featuredPost.date && (
                <time
                  dateTime={featuredPost.date}
                  className="text-xs text-brand-neutral-200 uppercase tracking-wide"
                >
                  {new Date(featuredPost.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
            </div>

            <h2 className="site-card-title">{featuredPost.title}</h2>

            {featuredPost.description && (
              <p className="site-card-description">
                {featuredPost.description}
              </p>
            )}
          </div>
        </div>
      </section>
    </Link>
  );
}
