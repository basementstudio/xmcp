import "react";

declare module "*.glsl" {
  const content: string;
  export default content;
}

declare module "*.vert" {
  const content: string;
  export default content;
}

declare module "*.frag" {
  const content: string;
  export default content;
}

declare module "react" {
  // Satori (`next/og` `ImageResponse`) accepts a Tailwind-style `tw` attribute
  // on JSX elements. It is not a real DOM attribute, so `@types/react` does not
  // declare it; augment HTMLAttributes so OG route JSX type-checks.
  interface HTMLAttributes<T> {
    tw?: string;
  }
}
