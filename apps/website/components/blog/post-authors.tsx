import Image from "next/image";
import { type BlogAuthor } from "@/utils/blog";
import Link from "next/link";
import { Icons } from "../icons";

interface PostAuthorsProps {
  authors: BlogAuthor[];
}

export function PostAuthors({ authors }: PostAuthorsProps) {
  if (authors.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-brand-neutral-100">
      {authors.map((author) => (
        <Link
          key={author.id}
          href={author.xUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 hover:text-brand-white transition-colors"
        >
          <Image
            src={author.profilePicture}
            alt={`${author.name} avatar`}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full border border-brand-neutral-500 bg-brand-neutral-800 object-cover"
            loading="lazy"
          />
          <div className="flex flex-col leading-5">
            <span className="text-brand-white font-medium">{author.name}</span>
            <span className="relative inline-flex h-5 items-center text-brand-neutral-200">
              <span className="transition-all duration-300 ease-out opacity-100 translate-y-0 group-hover:opacity-0 group-hover:-translate-y-1">
                {author.role ?? "Author"}
              </span>
              <span className="absolute left-0 transition-all duration-300 ease-out opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 inline-flex items-center gap-1">
                <Icons.x className="size-2.5 text-brand-neutral-200" />
                <span className="text-brand-neutral-200">{author.xHandle}</span>
              </span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
