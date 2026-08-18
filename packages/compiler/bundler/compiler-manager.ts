import { rspack, type Compiler, type RspackOptions } from "@rspack/core";

export function runCompiler(
  config: RspackOptions,
  callback: (err: Error | null, stats: any) => void
): void {
  const compiler: Compiler = rspack(config);
  if (process.env.NODE_ENV === "development" && config.watch) {
    compiler.watch({}, callback);
    return;
  }
  compiler.run(callback);
}
