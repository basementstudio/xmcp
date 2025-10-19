/**
 * SSR (Server-Side Rendering) utilities for React components
 */

import { XmcpConfigOuputSchema } from "@/compiler/config";

/**
 * Check if SSR is enabled in the config
 */
export function isSSREnabled(config?: XmcpConfigOuputSchema): boolean {
  return config?.experimental?.ssr?.enabled === true;
}

/**
 * Check if a file path is a React component (.tsx file)
 */
export function isReactFile(filePath: string): boolean {
  return filePath.endsWith('.tsx');
}
