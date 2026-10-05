import { XmcpConfigOutputSchema } from "@/runtime-config";
import { getResolvedHttpConfig } from "@/runtime-config";

import { compilerContext } from "../compiler-context";
import {
  injectAdapterVariables,
  injectCorsVariables,
  InjectedVariables,
  injectHttpVariables,
  injectObservabilityVariables,
  injectComponentsVariables,
  injectPathsVariables,
  injectServerInfoVariables,
  injectStdioVariables,
  injectTemplateVariables,
  injectTypescriptVariables,
} from "../config/injection";

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

  return {
    ...httpVariables,
    ...corsVariables,
    ...pathsVariables,
    ...stdioVariables,
    ...templateVariables,
    ...serverInfoVariables,
    ...adapterVariables,
    ...typescriptVariables,
    ...injectObservabilityVariables(xmcpConfig),
    ...injectComponentsVariables(xmcpConfig),
  };
}
