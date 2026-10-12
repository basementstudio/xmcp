import { Tag } from "@/components/ui/tag";
import { BlogPost, getListedBlogPosts } from "@/utils/blog";
import Link from "fumadocs-core/link";
import Image from "next/image";
import { getBlogImageProps } from "@/lib/blog-images";

const TEXTURE_IMAGES = [
  "/textures/text1.png",
  "/textures/text2.png",
  "/textures/text3.png",
  "/textures/text4.png",
];

export const HomeBlog = () => {
  const posts = getListedBlogPosts().slice(0, 3);

  return (
    <div className="col-span-full grid grid-cols-12 gap-[20px] py-8 md:py-16">
      <div className="home-section-heading">
        <div>
          <p className="eyebrow">04 / From the field</p>
          <h2 className="heading-2">
            Notes on building
            <br />
            with MCP.
          </h2>
        </div>
        <p>
          Guides, releases, and ideas from the people building the framework.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[20px] col-span-12">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
};

export const BlogCard = ({
  post,
  loading = "lazy",
  sizes = "(min-width: 1200px) 376px, (min-width: 768px) calc((100vw - 72px) / 3), (min-width: 640px) calc((100vw - 52px) / 2), calc(100vw - 32px)",
}: {
  post: BlogPost;
  loading?: "eager" | "lazy";
  sizes?: string;
}) => {
  const texture =
    post.previewImage ||
    post.textureImage ||
    TEXTURE_IMAGES[
      Math.abs(
        Array.from(post.slug).reduce(
          (hash, char) => hash + char.charCodeAt(0),
          0
        )
      ) % TEXTURE_IMAGES.length
    ];

  return (
    <Link
      key={post.slug}
      href={`/blog/${post.slug}`}
      className="text-left group relative overflow-visible h-full block"
    >
      <div className="relative rounded-lg overflow-hidden border bg-surface group-hover:bg-black h-full min-h-[16rem] w-full flex flex-col border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200">
        <div className="w-full aspect-video border-b border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200 overflow-hidden relative">
          {texture ? (
            <Image
              {...getBlogImageProps(texture)}
              alt={post.title}
              fill
              className="object-cover"
              sizes={sizes}
              loading={loading}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-gray-500 text-sm uppercase tracking-wide">
                {post.category}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <Tag text={post.category} />
            {post.date && (
              <time
                dateTime={post.date}
                className="text-xs text-brand-neutral-50 uppercase tracking-wide"
              >
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            )}
          </div>

          <h3 className="text-base md:text-[1.125rem] text-brand-white leading-tight mt-auto">
            {post.title}
          </h3>

          <div className="flex-1 flex flex-col justify-between">
            {post.description && (
              <p className="text-sm text-brand-neutral-100 leading-relaxed line-clamp-3">
                {post.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
