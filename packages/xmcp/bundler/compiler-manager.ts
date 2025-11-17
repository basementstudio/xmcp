import { rspack, RspackOptions, Compiler } from "@rspack/core";

interface CompilerManager {
  getCompiler(config: RspackOptions, key?: string): Compiler;
  run(
    config: RspackOptions,
    callback: (err: Error | null, stats: any) => void,
    key?: string
  ): void;
}

class CompilerManagerImpl implements CompilerManager {
  private compilerInstances = new Map<string, Compiler>();
  private watchStates = new Map<string, boolean>();
  private configs = new Map<string, RspackOptions>();

  /**
   * Get or create a compiler instance for the given config.
   * Uses a key to identify different compiler types (e.g., 'main', 'runtime').
   */
  getCompiler(config: RspackOptions, key: string = "default"): Compiler {
    const configChanged =
      JSON.stringify(config) !== JSON.stringify(this.configs.get(key));

    if (!this.compilerInstances.has(key) || configChanged) {
      this.compilerInstances.set(key, rspack(config));
      this.configs.set(key, config);
      this.watchStates.set(key, false); // Reset watch state when compiler is recreated
    }

    return this.compilerInstances.get(key)!;
  }

  /**
   * Run the compiler with the given config and callback.
   * Handles both watch mode and one-off builds.
   */
  run(
    config: RspackOptions,
    callback: (err: Error | null, stats: any) => void,
    key: string = "default"
  ): void {
    const compiler = this.getCompiler(config, key);
    const mode =
      process.env.NODE_ENV === "production" ? "production" : "development";
    const isWatching = this.watchStates.get(key) ?? false;

    // Use watch mode in development, run once in production
    if (mode === "development" && config.watch) {
      if (!isWatching) {
        this.watchStates.set(key, true);
        compiler.watch({}, callback);
      }
      // If already watching, the watcher will handle subsequent builds
    } else {
      compiler.run(callback);
    }
  }
}

// Export a singleton instance
const compilerManager = new CompilerManagerImpl();

export function getCompiler(config: RspackOptions, key?: string): Compiler {
  return compilerManager.getCompiler(config, key);
}

export function runCompiler(
  config: RspackOptions,
  callback: (err: Error | null, stats: any) => void,
  key?: string
): void {
  return compilerManager.run(config, callback, key);
}
