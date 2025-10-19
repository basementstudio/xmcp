/**
 * SSR (Server-Side Rendering) utilities for React components
 *
 * This module provides functionality to:
 * 1. Detect if a handler is a React component
 * 2. Render React components to HTML strings
 * 3. Bundle React components for client-side hydration
 * 4. Generate HTML with inlined hydration scripts
 */

import { isValidElement } from "react";
import { UserToolHandler } from "../transformers/tool";
import { XmcpConfigOuputSchema } from "@/compiler/config";

/**
 * Check if SSR is enabled in the config
 */
export function isSSREnabled(config?: XmcpConfigOuputSchema): boolean {
  return config?.experimental?.ssr?.enabled === true;
}

/**
 * Detect if a handler returns a React element
 *
 * A handler is considered a React component if:
 * 1. It's a function
 * 2. When called, it returns a valid React element
 */
export async function isReactComponent(handler: UserToolHandler): Promise<boolean> {
  if (typeof handler !== "function") {
    return false;
  }

  try {
    // Call the handler with empty args to see what it returns
    let result = handler({}, {} as any);

    // Await if it's a promise
    if (result instanceof Promise) {
      result = await result;
    }

    // Check if the result is a valid React element
    return isValidElement(result);
  } catch (error) {
    // If the handler throws (e.g., requires specific args),
    // we assume it's not a React component
    return false;
  }
}

/**
 * Check if a file path is a React component (.tsx file)
 */
export function isReactFile(filePath: string): boolean {
  return filePath.endsWith('.tsx');
}
