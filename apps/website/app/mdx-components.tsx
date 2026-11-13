import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}

const components: MDXComponents = {
  h1: ({ children }) => <h1 className="site-section-title">{children}</h1>,
  h2: ({ children }) => <h2 className="site-section-title">{children}</h2>,
  h3: ({ children }) => <h3 className="site-section-title">{children}</h3>,
  h4: ({ children }) => <h4 className="site-section-title">{children}</h4>,
  h5: ({ children }) => <h5 className="site-section-title">{children}</h5>,
  h6: ({ children }) => <h6 className="site-section-title">{children}</h6>,
  img: (props) => <Image {...props} alt={props.alt ?? ""} />,
  a: (props) => <Link {...props} />,
  code: (props) => <code {...props} />,
};

export default components;
