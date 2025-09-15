/**
 * Utilities for composing URIs from resource file paths following the convention:
 * - (scheme) folders become URI schemes
 * - [param] folders become dynamic parameters
 * - static folders become literal path segments
 * - file names become endpoints
 */

export type ResourceType = "direct" | "template";

export interface ResourceInfo {
  /** The original file path */
  filePath: string;
  /** The composed URI template */
  uriTemplate: string;
  /** The URI scheme extracted from (scheme) folder */
  scheme: string;
  /** Dynamic parameters extracted from [param] folders */
  parameters: string[];
  /** Static path segments */
  pathSegments: string[];
  /** Whether this is a direct resource or template resource */
  type: ResourceType;
}

/**
 * Compose a URI template from a resource file path
 *
 * @param filePath - The file path relative to resources folder
 * @returns ResourceInfo with composed URI and metadata
 *
 * @example
 * // Static resource
 * composeUriFromPath('(config)/app.ts')
 * // Returns: { uriTemplate: 'config://app', parameters: [], ... }
 *
 * // Dynamic parameter as file
 * composeUriFromPath('(users)/[id].ts')
 * // Returns: { uriTemplate: 'users://{id}', parameters: ['id'], ... }
 *
 * // Dynamic parameter as folder with index
 * composeUriFromPath('(users)/[id]/index.ts')
 * // Returns: { uriTemplate: 'users://{id}', parameters: ['id'], ... }
 *
 * // Complex nested
 * composeUriFromPath('(github)/repos/[owner]/[repo]/index.ts')
 * // Returns: { uriTemplate: 'github://repos/{owner}/{repo}', parameters: ['owner', 'repo'], ... }
 */
export function composeUriFromPath(filePath: string): ResourceInfo | null {
  const parts = filePath.split("/").filter((part) => part !== "");

  // find the scheme anchor: (scheme)
  const schemeIndex = parts.findIndex((part) => part.match(/^\(.+\)$/));

  if (schemeIndex === -1) {
    // no scheme found, skip this file
    return null;
  }

  // FOLDER-ONLY CONVENTION: reject [param].ts files (only allow [param]/index.ts)
  const fileName = parts[parts.length - 1];
  if (fileName && fileName.match(/^\[.+\]\.ts$/)) {
    // this is a [param].ts file, which violates folder-only convention
    // makes it difficult to scale when you can have subsegments of the same param and an index file for each
    return null;
  }

  const scheme = parts[schemeIndex].slice(1, -1); // (github) → github

  // process only parts AFTER the scheme
  const pathParts = parts.slice(schemeIndex + 1);

  // remove file extensions (.ts, .js, etc.)
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart && lastPart.includes(".")) {
    const fileName = lastPart.split(".")[0];
    // don't include 'index' in the URI path
    if (fileName !== "index") {
      pathParts[pathParts.length - 1] = fileName;
    } else {
      pathParts.pop();
    }
  }

  const parameters: string[] = [];
  const pathSegments: string[] = [];

  // process each path part
  const uriPathParts = pathParts.map((part) => {
    if (part.match(/^\[.+\]$/)) {
      // dynamic parameter: [owner] → {owner}
      const paramName = part.slice(1, -1);
      parameters.push(paramName);
      return `{${paramName}}`;
    } else {
      // static segment
      pathSegments.push(part);
      return part;
    }
  });

  const uriTemplate = `${scheme}://${uriPathParts.join("/")}`;

  // determine resource type based on parameters
  const type: ResourceType = parameters.length > 0 ? "template" : "direct";

  return {
    filePath,
    uriTemplate,
    scheme,
    parameters,
    pathSegments,
    type,
  };
}

/**
 * Get all resource URIs from a set of file paths
 */
export function getResourceUris(
  resourcePaths: Set<string>,
  basePath: string
): ResourceInfo[] {
  const resourceInfos: ResourceInfo[] = [];

  for (const fullPath of resourcePaths) {
    const relativePath = fullPath.replace(basePath + "/", "");

    const resourceInfo = composeUriFromPath(relativePath);
    if (resourceInfo) {
      resourceInfos.push(resourceInfo);
    }
  }

  return resourceInfos;
}

/** separate resources by type for different handling when injecting into the server */
export function categorizeResources(resourceInfos: ResourceInfo[]): {
  directResources: ResourceInfo[];
  templateResources: ResourceInfo[];
} {
  const directResources: ResourceInfo[] = [];
  const templateResources: ResourceInfo[] = [];

  resourceInfos.forEach((resource) => {
    if (resource.type === "direct") {
      directResources.push(resource);
    } else {
      templateResources.push(resource);
    }
  });

  return { directResources, templateResources };
}

/** validate resource URI against MCP standards */
export function validateResourceUri(resourceInfo: ResourceInfo): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // validate scheme format (lowercase alphanumeric + hyphens)
  // perhaps validate against RFC 6570 for extensibility?
  if (!resourceInfo.scheme.match(/^[a-z0-9-]+$/)) {
    errors.push(
      `Invalid scheme format: "${resourceInfo.scheme}". Use lowercase alphanumeric characters and hyphens only.`
    );
  }

  // validate parameter names (alphanumeric + underscores)
  resourceInfo.parameters.forEach((param) => {
    if (!param.match(/^[a-zA-Z0-9_]+$/)) {
      errors.push(
        `Invalid parameter name: "${param}". Use alphanumeric characters and underscores only.`
      );
    }
  });

  // validate path segments (no special characters that could break URIs)
  resourceInfo.pathSegments.forEach((segment) => {
    if (!segment.match(/^[a-zA-Z0-9_-]+$/)) {
      errors.push(
        `Invalid path segment: "${segment}". Use alphanumeric characters, underscores, and hyphens only.`
      );
    }
  });

  // ensure URI doesn't end with slash (unless it's just the scheme)
  if (
    resourceInfo.uriTemplate.endsWith("/") &&
    resourceInfo.uriTemplate !== `${resourceInfo.scheme}://`
  ) {
    errors.push(
      `URI template should not end with trailing slash: "${resourceInfo.uriTemplate}"`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
