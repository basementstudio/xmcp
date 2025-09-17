import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import React from "react";
import { Code, Pre } from "./code-blocks";
import { TutorialCard } from "@/components/ui/tutorial-card";
import { Step } from "@/components/ui/step";
import { ContinueLink } from "@/components/ui/continue-link";

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-gray-300 pl-6 my-6 text-gray-700 italic leading-relaxed">
      {children}
    </blockquote>
  );
}

function Source({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 mb-6 text-sm text-gray-400 flex items-center gap-2">
      <span className="font-medium">Source:</span>
      <span>{children}</span>
    </div>
  );
}

function Table({ data }: { data: { headers: string[]; rows: string[][] } }) {
  const headers = data.headers.map((header, index) => (
    <th key={index}>{header}</th>
  ));
  const rows = data.rows.map((row, index) => (
    <tr key={index}>
      {row.map((cell, cellIndex) => (
        <td key={cellIndex}>{cell}</td>
      ))}
    </tr>
  ));

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

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

function WarningIcon() {
  return (
    <svg
      width="22"
      height="20"
      viewBox="0 0 22 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.5 0.139404L22 9.6394L16.5 19.1394H5.5L0 9.6394L5.5 0.139404H16.5ZM10 12.6394V14.6394H12V12.6394H10ZM10 4.6394V10.6394H12V4.6394H10Z"
        fill="#BF6464"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20ZM9 13V15H11V13H9ZM9 5V11H11V5H9Z"
        fill="#64A4BF"
      />
    </svg>
  );
}

function Callout({
  type = "normal",
  children,
}: {
  type?: "normal" | "warning" | "info";
  children: React.ReactNode;
}) {
  const getIcon = () => {
    switch (type) {
      case "warning":
        return <WarningIcon />;
      case "info":
        return <InfoIcon />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start gap-4 py-2 my-4 px-4 rounded-[2px] border border-[#424242] font-mono text-[16px] leading-[24px] tracking-[0.32px] text-[#a8a8a8] [&_p]:m-0 [&_p]:p-0">
      {type !== "normal" && <div className="mt-1">{getIcon()}</div>}
      <div className="flex-1">{children}</div>
    </div>
  );
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
        <ElementTag className="relative font-mono uppercase" {...props}>
          <div id={slug} className="absolute pointer-none"></div>
          <span>{children}</span>
        </ElementTag>
      );
    }

    return (
      <ElementTag className="relative" {...props}>
        <div id={slug} className="absolute -top-[10rem] pointer-none"></div>
        <a href={`#${slug}`} className="font-mono uppercase">
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
  blockquote: Quote,
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  pre: Pre,
  Table,
  Quote,
  Source,
  Callout,
  TutorialCard,
  Step,
  ContinueLink,
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
