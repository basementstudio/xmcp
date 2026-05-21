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
    ],
  },
  async redirects() {
    return [
      {
        source: "/docs/configuration/webpack",
        destination: "/docs/configuration/bundler",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/docs/:slug*.md", destination: "/llms.mdx/:slug*" },
      { source: "/docs/:slug*.mdx", destination: "/llms.mdx/:slug*" },
      { source: "/docs.md", destination: "/llms.txt" },
      { source: "/docs.mdx", destination: "/llms.txt" },
    ];
  },
};

export default withMDX(nextConfig);
