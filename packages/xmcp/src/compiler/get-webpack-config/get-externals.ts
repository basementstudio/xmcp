import { Configuration } from "webpack";
import { getXmcpConfig } from "../compiler-context";
import { builtinModules } from "module";
import { runtimeFiles } from "./plugins";
import nodeExternals from "webpack-node-externals";

/**
 * This function will decide is a file is bundled by xmcp compiler or not.
 * We want to avoid building node modules.
 * When using Next.js, we want to avoid building tools/*, since the nexjs compiler will handle that code.
 */
export function getExternals(): Configuration["externals"] {
  const xmcpConfig = getXmcpConfig();

  const replacedImports = new Set<string>();

  return [
    // Use webpack-node-externals to properly exclude all node_modules
    // This prevents webpack from trying to bundle native modules like @swc/core
    nodeExternals({
      allowlist: [
        // Bundle .xmcp folder files
        /\.xmcp/,
      ],
    }),

    function (data, callback) {
      const { request } = data;

      if (!request) {
        return callback();
      }

      /**
       * Externalize Node.js built-in modules
       */
      const isBuiltinModule =
        builtinModules.includes(request) ||
        builtinModules.includes(request.replace(/^node:/, ""));
      if (isBuiltinModule) {
        return callback(null, `commonjs ${request}`);
      }

      /**
       * Externalize SSR utilities that depend on @swc/core
       * These are loaded at runtime only when SSR is enabled
       */
      if (
        request.includes("ssr/transpile") ||
        request.includes("ssr/bundler")
      ) {
        return callback(null, `commonjs ${request}`);
      }

      // Check if request is inside .xmcp folder - if so, bundle it
      if (request.includes(".xmcp")) {
        return callback();
      }

      // Check if request is a runtime file - if so, bundle it
      const filesToInclude = [...Object.keys(runtimeFiles), "import-map.js"];
      for (const file of filesToInclude) {
        if (
          request.endsWith(`./${file}`) ||
          request.endsWith(`./${file.replace(".js", "")}`)
        ) {
          return callback();
        }
      }

      /**
       * When using Next.js, we want them to bundle the code for the tool file,
       * so just keep the reference for the import as external
       */
      if (xmcpConfig.experimental?.adapter === "nextjs") {
        /**
         * Externalize React and ReactDOM to prevent multiple copies
         * Next.js provides React at runtime, so we avoid bundling it
         */
        if (
          request === "react" ||
          request === "react-dom" ||
          request === "react-dom/server" ||
          request === "react/jsx-runtime"
        ) {
          return callback(null, `commonjs ${request}`);
        }
        // Bundle imports from the same folder
        if (request.startsWith("./")) {
          return callback();
        }

        let pathRequest = request;
        /**
         * Paths are relative to the .xmcp/nextjs-adapter folder,
         * but we are building in .xmcp/adapter/index.js, so we need to go up 2 levels
         */
        if (request.startsWith("../")) {
          // Only replace the import if it hasn't been replaced yet
          if (!replacedImports.has(request)) {
            pathRequest = pathRequest.replace("../", "../../");
            replacedImports.add(pathRequest);
          }
        }

        return callback(null, `commonjs ${pathRequest}`);
      }

      // Bundle relative imports and absolute paths
      callback();
    },
  ];
}
