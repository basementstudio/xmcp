import Link from "next/link";
import Image from "next/image";
import { type BlogPost } from "../../utils/blog";
import { Tag } from "../ui/tag";

interface BlogHeroProps {
  featuredPost: BlogPost;
}

export function BlogHero({ featuredPost }: BlogHeroProps) {
  const image = featuredPost.previewImage || featuredPost.textureImage;

  return (
    <Link href={`/blog/${featuredPost.slug}`} className="block col-span-12">
      <section className="relative group overflow-visible mb-2">
        <div className="relative border border-brand-neutral-500 group-hover:border-brand-neutral-300 w-full flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 md:border-r border-brand-neutral-500 overflow-hidden mb-4 md:mb-0 group-hover:border-brand-neutral-300">
            {image ? (
              <Image
                src={image}
                alt={featuredPost.title}
                width={0}
                height={0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="w-full h-auto"
              />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center text-brand-neutral-200 text-sm">
                No preview image
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col p-8">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-3">
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

            <h1 className="text-base md:text-2xl text-brand-white font-medium mb-3 md:mb-4 leading-tight">
              {featuredPost.title}
            </h1>

            {featuredPost.description && (
              <p className="text-sm md:text-base text-brand-neutral-200 leading-relaxed">
                {featuredPost.description}
              </p>
            )}
          </div>
        </div>
      </section>
    </Link>
  );
}
