"use client";

import { Tag } from "@/components/ui/tag";
import { useFadeIn } from "@/lib/anim/use-fade-in";
import { BlogPost } from "@/utils/blog";
import Link from "fumadocs-core/link";
import { AnimatedHeading } from "@/components/ui/animated-heading";
import Image from "next/image";
import { useRef } from "react";

export const HomeBlogClient = ({ posts }: { posts: BlogPost[] }) => {
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useFadeIn({
    refs: [descriptionRef],
    yOffset: 20,
  });

  useFadeIn({
    refs: [cardsRef],
    yOffset: 30,
    delay: 0.2,
    start: "top 80%",
  });

  return (
    <div className="col-span-full grid grid-cols-12 gap-[20px] py-8 md:py-16">
      <div className="flex flex-col items-start justify-center col-span-12 lg:col-span-9 lg:col-start-2 w-full mx-auto mb-8 gap-3">
        <div className="grid grid-cols-12 lg:grid-cols-9 gap-2 lg:gap-8 w-full">
          <div className="flex flex-col gap-3 col-span-12 lg:col-span-4">
            <Tag text="Blog" className="w-fit" animate />
            <AnimatedHeading
              effectDuration={2}
              as="h2"
              className="heading-2 text-balance mt-auto text-gradient"
            >
              Guides & changelogs
            </AnimatedHeading>
          </div>
          <p
            className="text-brand-neutral-100 text-base col-span-12 max-w-[650px] lg:col-span-5 mt-auto"
            ref={descriptionRef}
          >
            Learn, build, and stay up to date with the latest guides,
            changelogs, and insights to make the most of your MCP server.
          </p>
        </div>
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[20px] col-span-12"
        ref={cardsRef}
      >
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
};

export const BlogCard = ({
  post,
  ref,
}: {
  post: BlogPost;
  ref?: React.Ref<HTMLAnchorElement>;
}) => {
  return (
    <Link
      key={post.slug}
      href={`/blog/${post.slug}`}
      className="text-left group relative overflow-visible h-full block"
      ref={ref}
    >
      <div className="relative border group-hover:bg-black h-full min-h-[16rem] w-full flex flex-col border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200">
        <div className="w-full aspect-video border-b border-brand-neutral-500 group-hover:border-brand-neutral-300 transition-colors duration-200 overflow-hidden relative">
          {post.previewImage ? (
            <Image
              src={post.previewImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
              quality={100}
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
