/**
 * Unwraps the extra namespace layer stacked bundler interop can add around
 * externalized tool/prompt/resource modules. When the adapter bundle's
 * require() of an ESM file returns a namespace without the __esModule marker
 * (e.g. Turbopack in a "type": "module" app), rspack's commonjs-external
 * interop wraps it again, leaving the real module namespace nested under
 * `default`. A valid module always has a handler function as its default
 * export, so an object-shaped `default` that itself carries a `default` key
 * can only be that wrapper.
 */
export function unwrapInteropModule(module: unknown): unknown {
  if (typeof module !== "object" || module === null) {
    return module;
  }

  const inner = (module as Record<string, unknown>).default;
  if (typeof inner === "object" && inner !== null && "default" in inner) {
    return inner;
  }

  return module;
}
