import { XmcpConfigOutputSchema } from "@/compiler/config";
import { compilerContext } from "../compiler-context";
import {
  injectCorsVariables,
  InjectedVariables,
  injectHttpVariables,
  injectOAuthVariables,
  injectPathsVariables,
  injectStdioVariables,
  injectTemplateVariables,
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
  const oauthVariables = injectOAuthVariables(xmcpConfig);
  const pathsVariables = injectPathsVariables(xmcpConfig);
  const stdioVariables = injectStdioVariables(xmcpConfig.stdio);
  const templateVariables = injectTemplateVariables(xmcpConfig);
  const adapterVariables = injectAdapterVariables(xmcpConfig);
  const typescriptVariables = injectTypescriptVariables(xmcpConfig);

  return {
    ...httpVariables,
    ...corsVariables,
    ...oauthVariables,
    ...pathsVariables,
    ...stdioVariables,
    ...templateVariables,
    ...adapterVariables,
    ...typescriptVariables,
  };
}
