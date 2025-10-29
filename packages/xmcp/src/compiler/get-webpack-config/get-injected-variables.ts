import { XmcpConfigOuputSchema } from "@/compiler/config";
import { compilerContext } from "../compiler-context";
import {
  injectCorsVariables,
  InjectedVariables,
  injectHttpVariables,
  injectOAuthVariables,
  injectPathsVariables,
  injectStdioVariables,
  injectTemplateVariables,
  injectSSRVariables,
  injectAdapterVariables,
} from "../config/injection";

/**
 * The XMCP runtime uses variables that are not defined by default.
 *
 * This utility will define those variables based on the user's config.
 */
export function getInjectedVariables(
  xmcpConfig: XmcpConfigOuputSchema
): InjectedVariables {
  const { mode } = compilerContext.getContext();

  const httpVariables = injectHttpVariables(xmcpConfig.http, mode);
  const corsVariables = injectCorsVariables(xmcpConfig.http);
  const oauthVariables = injectOAuthVariables(xmcpConfig);
  const pathsVariables = injectPathsVariables(xmcpConfig);
  const stdioVariables = injectStdioVariables(xmcpConfig.stdio);
  const templateVariables = injectTemplateVariables(xmcpConfig);
  const ssrVariables = injectSSRVariables(xmcpConfig);
  const adapterVariables = injectAdapterVariables(xmcpConfig);

  return {
    ...httpVariables,
    ...corsVariables,
    ...oauthVariables,
    ...pathsVariables,
    ...stdioVariables,
    ...templateVariables,
    ...ssrVariables,
    ...adapterVariables,
  };
}
