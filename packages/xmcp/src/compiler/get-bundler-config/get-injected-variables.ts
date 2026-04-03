import { XmcpConfigOutputSchema } from "@/compiler/config";
import { compilerContext } from "../compiler-context";
import {
  injectCorsVariables,
  InjectedVariables,
  injectHttpVariables,
  injectPathsVariables,
  injectStdioVariables,
  injectTemplateVariables,
  injectServerInfoVariables,
  injectAdapterVariables,
  injectTypescriptVariables,
} from "../config/injection";
import { getResolvedHttpConfig } from "../config/utils";

/**
 * The XMCP runtime uses variables that are not defined by default.
 *
 * This utility will define those variables based on the user's config.
 */
export function getInjectedVariables(
  xmcpConfig: XmcpConfigOutputSchema
): InjectedVariables {
  const { mode } = compilerContext.getContext();

  const resolvedHttpConfig = getResolvedHttpConfig(xmcpConfig.http);
  const httpVariables = injectHttpVariables(xmcpConfig.http, mode);
  const corsVariables = injectCorsVariables(resolvedHttpConfig);
  const pathsVariables = injectPathsVariables(xmcpConfig);
  const stdioVariables = injectStdioVariables(xmcpConfig.stdio);
  const templateVariables = injectTemplateVariables(xmcpConfig);
  const serverInfoVariables = injectServerInfoVariables(xmcpConfig);
  const adapterVariables = injectAdapterVariables(xmcpConfig);
  const typescriptVariables = injectTypescriptVariables(xmcpConfig);

  // Compute enable list for runtime (union of include + enable arrays)
  const toolsConfig = xmcpConfig.tools;
  const enableList = [
    ...(toolsConfig?.include ?? []),
    ...(toolsConfig?.enable ?? []),
  ];

  return {
    ...httpVariables,
    ...corsVariables,
    ...pathsVariables,
    ...stdioVariables,
    ...templateVariables,
    ...serverInfoVariables,
    ...adapterVariables,
    ...typescriptVariables,
    INJECTED_TOOLS_ENABLE:
      enableList.length > 0 ? JSON.stringify(enableList) : "undefined",
  };
}
