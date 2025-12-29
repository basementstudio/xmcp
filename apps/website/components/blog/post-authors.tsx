import Image from "next/image";
import { type BlogAuthor } from "@/utils/blog";
import Link from "next/link";

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
          className="flex items-center gap-3 hover:text-brand-white transition-colors"
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
            <span className="text-brand-neutral-200">
              {author.role ?? "Author"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
