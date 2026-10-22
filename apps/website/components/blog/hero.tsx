import { ContentCard } from "@/components/ui/content-card";
import { BlogArtwork } from "./artwork";
import { type BlogPost } from "../../utils/blog";
import { Tag } from "../ui/tag";

interface BlogHeroProps {
  featuredPost: BlogPost;
}

export function BlogHero({ featuredPost }: BlogHeroProps) {
  const image = featuredPost.previewImage || featuredPost.textureImage;

  return (
    <ContentCard
      href={`/blog/${featuredPost.slug}`}
      className="col-span-12"
      horizontal
      media={
        image ? (
          <BlogArtwork
            src={image}
            alt={featuredPost.title}
            sizes="(min-width: 768px) 350px, (min-width: 740px) 700px, calc(100vw - 40px)"
            preload
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-neutral-200 text-sm">
            No preview image
          </div>
        )
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tag text="Featured" />
          <Tag text={featuredPost.category} />
        </div>
        {featuredPost.date && (
          <time
            dateTime={featuredPost.date}
            className="text-xs text-brand-neutral-200 tracking-wide"
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
        <p className="site-card-description">{featuredPost.description}</p>
      )}
    </ContentCard>
  );
}
