import {
  ReadResourceResult,
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import { ZodRawShape } from "zod/v3";
import {
  composeUriFromPath,
  ResourceInfo,
} from "../utils/resource-uri-composer";

/**
 * Type for the original resource handler that users write
 */
export type UserResourceHandler = (
  args: ZodRawShape,
  extra?: RequestHandlerExtra<ServerRequest, ServerNotification>
) => ReadResourceResult | string | Promise<ReadResourceResult | string>;

/**
 * Type for the transformed handler that the MCP server expects (direct resources)
 */
export type McpResourceHandler = (
  uri: URL,
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) => ReadResourceResult | Promise<ReadResourceResult>;

/**
 * Transforms a user's resource handler into an MCP-compatible handler.
 *
 * This function:
 * 1. Extracts parameters from the URI based on the resource file path
 * 2. Passes the parameters to the user's handler
 * 3. Transforms string responses into the required ReadResourceResult format
 * 4. Ensures the URI is included in the response content
 *
 * @param handler - The user's resource handler function
 * @param filePath - The resource file path (used to extract URI template and parameters)
 * @returns A transformed handler compatible with McpServer.registerResource
 * @throws Error if the handler returns an invalid response type
 */
export function transformResourceHandler(
  handler: UserResourceHandler,
  filePath: string,
  schema: ZodRawShape = {}
): McpResourceHandler {
  const resourceInfo = composeUriFromPath(filePath);

  if (!resourceInfo) {
    throw new Error(
      `Invalid resource file path: ${filePath}. Must follow (scheme)/path/[param] convention.`
    );
  }

  return async (
    uri: URL,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<ReadResourceResult> => {
    // extract and validate parameters from the actual URI using the template and schema
    const parameters = extractParametersFromUri(uri.href, resourceInfo, schema);

    let response = handler(parameters, extra);

    // only await if it's actually a promise
    if (response instanceof Promise) {
      response = await response;
    }

    // transform string response to ReadResourceResult
    if (typeof response === "string") {
      return {
        contents: [
          {
            uri: uri.href,
            text: response,
          },
        ],
      };
    }

    // validate response format
    if (
      !response ||
      typeof response !== "object" ||
      !Array.isArray(response.contents)
    ) {
      const responseType = response === null ? "null" : typeof response;
      const responseValue =
        response === undefined
          ? "undefined"
          : response === null
            ? "null"
            : typeof response === "object"
              ? JSON.stringify(response, null, 2)
              : String(response);

      throw new Error(
        `Resource handler must return a ReadResourceResult or string. ` +
          `Got ${responseType}: ${responseValue}\n\n` +
          `Expected ReadResourceResult format:\n` +
          `{\n` +
          `  contents: [\n` +
          `    { uri: "resource://uri", text: "content here" },\n` +
          `    { uri: "resource://uri", mimeType: "application/json", text: "json content" },\n` +
          `    { uri: "resource://uri", blob: base64data }\n` +
          `  ]\n` +
          `}`
      );
    }

    // ensure all content items have the URI set
    response.contents.forEach((content) => {
      if (!content.uri) {
        content.uri = uri.href;
      }
    });

    return response;
  };
}

/**
 * Extract and validate parameters from a concrete URI using the resource template info
 *
 * @param uri - The actual URI string being requested
 * @param resourceInfo - The resource template information
 * @param schema - The user's Zod schema for validation
 * @returns Object with validated parameter names and values
 * @throws Error if parameter validation fails
 */
function extractParametersFromUri(
  uri: string,
  resourceInfo: ResourceInfo,
  schema: ZodRawShape
): Record<string, any> {
  const extractedValues: Record<string, string> = {};
  const validatedParameters: Record<string, any> = {};

  if (resourceInfo.parameters.length === 0) {
    // direct resource, no parameters to extract
    return validatedParameters;
  }

  // for template resources, extract parameter values from the URI
  // example:
  // Template: users://{userId}/profile
  // Actual URI: users://123/profile
  // Extract: { userId: "123" }

  const templatePath = resourceInfo.uriTemplate.split("://")[1] || "";
  const actualPath = uri.split("://")[1] || "";

  const templateParts = templatePath.split("/");
  const actualParts = actualPath.split("/");

  // match template parts with actual parts to extract parameter values
  for (let i = 0; i < templateParts.length && i < actualParts.length; i++) {
    const templatePart = templateParts[i];
    const actualPart = actualParts[i];

    // check if this template part is a parameter (e.g., {userId})
    const paramMatch = templatePart.match(/^\{(.+)\}$/);
    if (paramMatch) {
      const paramName = paramMatch[1];
      extractedValues[paramName] = actualPart; // extract actual value
    }
  }

  // validate extracted parameters against the user's schema
  for (const paramName of resourceInfo.parameters) {
    const paramValue = extractedValues[paramName];
    const paramSchema = schema[paramName];

    if (paramValue === undefined) {
      throw new Error(`Missing required parameter: ${paramName}`);
    }

    if (!paramSchema) {
      // no schema defined for this parameter, pass through as string to prevent breaking
      validatedParameters[paramName] = paramValue;
      continue;
    }

    try {
      validatedParameters[paramName] = paramSchema.parse(paramValue);
    } catch (error) {
      throw new Error(
        `Invalid parameter "${paramName}": ${paramValue}. ` +
          `Validation error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return validatedParameters;
}
