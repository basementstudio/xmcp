import Link from "next/link";
import Image from "next/image";
import { type BlogPost } from "@/utils/blog";

interface BlogHeroProps {
  featuredPost: BlogPost;
}

export function BlogHero({ featuredPost }: BlogHeroProps) {
  return (
    <Link href={`/blog/${featuredPost.slug}`} className="block">
      <section className="relative group overflow-visible h-full mb-12">
        <div className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible border-[#333]" />
        <div className="relative border border-[#333] p-4 md:p-8 group-hover:bg-black h-full w-full flex flex-col md:flex-row gap-4 md:gap-8">
          <div className="w-full md:w-1/2 aspect-video border border-white/20 bg-black/20 flex-shrink-0 relative overflow-hidden mb-4 md:mb-0">
            {featuredPost.previewImage ? (
              <Image
                src={featuredPost.previewImage}
                alt={featuredPost.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                No preview image
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 border border-white/20 text-white/80 uppercase tracking-wide">
                  FEATURED
                </span>
                <span className="text-xs px-2 py-1 border border-white/20 text-white/80 uppercase tracking-wide">
                  {featuredPost.category}
                </span>
              </div>
              {featuredPost.date && (
                <time
                  dateTime={featuredPost.date}
                  className="text-xs text-[#BABABA] uppercase tracking-wide"
                >
                  {new Date(featuredPost.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
            </div>

            <h1 className="text-base md:text-2xl text-white font-medium mb-3 md:mb-4 leading-tight uppercase">
              {featuredPost.title}
            </h1>

            {featuredPost.description && (
              <p className="text-sm md:text-base text-[#BABABA] leading-relaxed">
                {featuredPost.description}
              </p>
            )}
          </div>
        </div>
      </section>
    </Link>
  );
}
