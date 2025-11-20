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
        source: "/docs/webpack",
        destination: "/docs/bundler",
        permanent: true,
      },
    ];
  },
};

export default withMDX(nextConfig);
