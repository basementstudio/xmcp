import {
  McpServer,
  ResourceMetadata,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp";
import { ResourceFile } from "./server";
import { isZodRawShape, pathToName } from "./tools";
import { ZodRawShape } from "zod";
import { transformResourceHandler } from "./transformers/resource";
import { composeUriFromPath } from "./utils/resource-uri-composer";

/** Loads resources and injects them into the server */
export function addResourcesToServer(
  server: McpServer,
  resourcesModules: Map<string, ResourceFile>
): McpServer {
  resourcesModules.forEach((resourceModule, path) => {
    const defaultName = pathToName(path);

    const resourceConfig: ResourceMetadata = {
      name: defaultName,
      description: "No description provided",
    };

    const { default: handler, metadata, schema } = resourceModule;

    if (typeof metadata === "object" && metadata !== null) {
      Object.assign(resourceConfig, metadata);
    }

    let resourceSchema: ZodRawShape = {};
    if (isZodRawShape(schema)) {
      resourceSchema = schema;
    } else if (schema !== undefined && schema !== null) {
      console.warn(
        `Invalid schema for resource "${resourceConfig.name}" at ${path}. Expected Record<string, z.ZodType>`
      );
    }

    // get resource info from the file path to determine URI and type
    const resourceInfo = composeUriFromPath(path);

    if (!resourceInfo) {
      console.warn(
        `Skipping resource "${resourceConfig.name}" at ${path}: Invalid file path format`
      );
      return;
    }

    const transformedHandler = transformResourceHandler(
      handler,
      path,
      resourceSchema
    );

    if (resourceInfo.type === "direct") {
      // register as a direct resource (static composed URI)
      server.registerResource(
        resourceConfig.name as string,
        resourceInfo.uriTemplate,
        resourceConfig,
        transformedHandler
      );
    } else {
      // register as a resource template (dynamic URI with parameters)
      const resourceTemplate = new ResourceTemplate(resourceInfo.uriTemplate, {
        list: undefined,
      });

      // create template callback that directly uses variables instead of re-parsing URI
      // this is a wrapper over the transformed handler
      // would be nice to have a modelling layer + assertion to handle this
      const templateCallback = async (uri: URL, variables: any, extra: any) => {
        // validate parameters against schema
        const validatedParams: Record<string, any> = {};
        for (const paramName of resourceInfo.parameters) {
          const paramValue = variables[paramName];
          const paramSchema = resourceSchema[paramName];

          if (paramValue === undefined) {
            // throw a nice hint error
            throw new Error(
              `Missing required parameter: ${paramName}. Available variables: ${Object.keys(variables)}`
            );
          }

          if (paramSchema) {
            validatedParams[paramName] = paramSchema.parse(paramValue);
          } else {
            validatedParams[paramName] = paramValue;
          }
        }

        let response = handler(validatedParams, extra);
        if (response instanceof Promise) response = await response;

        return typeof response === "string"
          ? { contents: [{ uri: uri.href, text: response }] }
          : response;
      };

      server.registerResource(
        resourceConfig.name as string,
        resourceTemplate,
        resourceConfig,
        templateCallback
      );
    }
  });

  return server;
}
