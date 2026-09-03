import { compilerContext } from "@/compiler/compiler-context";
import { XmcpConfigOutputSchema } from "@/runtime-config";

/**
 * Whether this build emits the function entry Vercel invokes per request.
 *
 * Vercel sets `VERCEL=1` for every build it runs, adapter projects included,
 * but only a non-adapter build produces that function: an adapter build hands
 * its output to the host framework, which serves the endpoint itself. Which
 * entry is built, which prebuilt runtime is copied, and how the bundle exports
 * itself all have to agree on that, so the condition is derived once here.
 */
export function isVercelFunctionBuild(
  xmcpConfig: XmcpConfigOutputSchema
): boolean {
  const { platforms } = compilerContext.getContext();

  return !!platforms.vercel && !xmcpConfig.experimental?.adapter;
}
