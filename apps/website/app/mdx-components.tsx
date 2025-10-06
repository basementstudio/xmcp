import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}

const components: MDXComponents = {
  h1: ({ children }) => <h1 className="text-4xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-3xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="text-2xl font-bold">{children}</h3>,
  h4: ({ children }) => <h4 className="text-xl font-bold">{children}</h4>,
  h5: ({ children }) => <h5 className="text-lg font-bold">{children}</h5>,
  h6: ({ children }) => <h6 className="text-base font-bold">{children}</h6>,
  img: (props) => <Image alt={props.alt} {...props} />,
  a: (props) => <Link {...props} />,
  code: (props) => <code {...props} />,
};

export default components;
