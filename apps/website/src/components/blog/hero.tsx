import Link from "next/link";
import { type BlogPost } from "@/utils/blog";

interface BlogHeroProps {
  featuredPost: BlogPost;
}

export function BlogHero({ featuredPost }: BlogHeroProps) {
  return (
    <Link href={`/blog/${featuredPost.slug}`} className="block">
      <section className="relative group overflow-visible h-full mb-12">
        <div className="top-1 left-1 absolute w-full h-full group-hover:border group-hover:visible invisible border-[#333]" />
        <div className="relative border border-[#333] p-8 md:p-12 group-hover:bg-black h-full w-full flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 h-64 md:h-80 border border-white/20 bg-black/20 flex-shrink-0" />

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
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

            <h1 className="text-xl md:text-2xl text-white font-medium mb-4 leading-tight uppercase">
              {featuredPost.title}
            </h1>

            {featuredPost.description && (
              <p className="text-[#BABABA] leading-relaxed">
                {featuredPost.description}
              </p>
            )}
          </div>
        </div>
      </section>
    </Link>
  );
}
