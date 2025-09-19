import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import React from "react";
import { Code, Pre } from "./code-blocks";
import { Callout } from "@/components/ui/callout";

function CustomLink(props: { href: string; children: React.ReactNode }) {
  const href = props.href;

  if (href.startsWith("/")) {
    return (
      <Link {...props} href={href}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props: {
  alt: string;
  src: string;
  width: number;
  height: number;
}) {
  return <Image {...props} alt={props.alt} className="rounded-lg" />;
}

export function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function createHeading(level: number) {
  const Heading = ({ children, ...props }: { children: string }) => {
    const slug = slugify(children);

    const ElementTag = `h${level}` as "h1";

    // Don't create anchor links for h1 titles
    if (level === 1) {
      return (
        <ElementTag className="uppercase relative" {...props}>
          <div id={slug} className="absolute pointer-none:"></div>
          <span>{children}</span>
        </ElementTag>
      );
    }

    return (
      <ElementTag className="uppercase relative" {...props}>
        <div id={slug} className="absolute -top-[10rem] pointer-none:"></div>
        <a href={`#${slug}`} className="uppercase font-mono">
          <div className="anchor" />
          <span>{children}</span>
        </a>
      </ElementTag>
    );
  };

  Heading.displayName = `Heading${level}`;

  return Heading;
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  // p: (props: { children: React.ReactNode }) => <p {...props} />,
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  pre: Pre,
  Callout,
};

export function CustomMDX(props: {
  source: string;
  components?: Record<string, React.ComponentType<unknown>>;
}) {
  return (
    <MDXRemote
      {...props}
      components={{ ...components, ...(props.components || {}) }}
    />
  );
}
