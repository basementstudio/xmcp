import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX({
  // customise the config file path
  configPath: "source.config.ts",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    /** Add glslify loader to webpack */
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;
  },
  turbopack: {
    rules: {
      "*.{glsl,vert,frag,vs,fs}": {
        loaders: ["raw-loader", "glslify-loader"],
        as: "*.js",
      },
    },
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        hostname: "assets.basehub.com",
      },
      {
        hostname: "raw.githubusercontent.com",
      },
      {
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/docs/configuration/webpack",
        destination: "/docs/configuration/bundler",
        permanent: true,
      },
      {
        source: "/examples",
        destination: "/templates",
        permanent: true,
      },
      {
        source: "/examples/:slug",
        destination: "/templates/:slug",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // Content negotiation: agents sending `Accept: text/markdown` get the
    // markdown route; browsers (which never list text/markdown) fall through to
    // HTML. These must run in `beforeFiles` so `/` is intercepted before the
    // homepage page route resolves (`afterFiles` runs after page matching).
    const acceptsMarkdown = [
      { type: "header" as const, key: "accept", value: ".*text/markdown.*" },
    ];
    return {
      beforeFiles: [
        { source: "/", has: acceptsMarkdown, destination: "/llms.mdx" },
        {
          source: "/docs/:slug*",
          has: acceptsMarkdown,
          destination: "/llms.mdx/:slug*",
        },
      ],
      afterFiles: [
        { source: "/docs/:slug*.md", destination: "/llms.mdx/:slug*" },
        { source: "/docs/:slug*.mdx", destination: "/llms.mdx/:slug*" },
        { source: "/docs.md", destination: "/llms.txt" },
        { source: "/docs.mdx", destination: "/llms.txt" },
      ],
    };
  },
  async headers() {
    // RFC 8288 Link headers point agents at discoverable resources from the
    // homepage. Single comma-separated value because Next overrides duplicate
    // header keys (last wins).
    return [
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: [
              '</docs>; rel="service-doc"; type="text/html"',
              '</llms.txt>; rel="service-desc"; type="text/plain"',
              '</llms-full.txt>; rel="describedby"; type="text/plain"',
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
