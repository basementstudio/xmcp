import type { XmcpConfigOuputSchema } from "@/compiler/config";
import { compilerContext } from "../compiler-context";
import {
  injectCorsVariables,
  injectHttpVariables,
  injectOAuthVariables,
  injectPathsVariables,
  injectStdioVariables,
  InjectedVariables,
} from "../config/injection";

/**
 * The XMCP runtime uses variables that are not defined by default.
 *
 * This utility will define those variables based on the user's config.
 */
export function getInjectedVariables(
  xmcpConfig: XmcpConfigOuputSchema,
  projectPath?: string
): InjectedVariables {
  const { mode } = compilerContext.getContext();

  const httpVariables = injectHttpVariables(xmcpConfig.http, mode);
  const corsVariables = injectCorsVariables(xmcpConfig.http);
  const oauthVariables = injectOAuthVariables(xmcpConfig);
  const pathsVariables = injectPathsVariables(xmcpConfig);
  const stdioVariables = injectStdioVariables(xmcpConfig.stdio, projectPath);

  return {
    ...httpVariables,
    ...corsVariables,
    ...oauthVariables,
    ...pathsVariables,
    ...stdioVariables,
  };
}
