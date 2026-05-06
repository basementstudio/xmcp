import { describe, it, expect } from "vitest";
import {
  getResolvedHttpConfig,
  getResolvedStdioConfig,
  getResolvedPathsConfig,
  getResolvedTemplateConfig,
  getResolvedTypescriptConfig,
  getResolvedExperimentalConfig,
  getResolvedCorsConfig,
} from "@/compiler/config/utils";
import {
  injectHttpVariables,
  injectCorsVariables,
  injectPathsVariables,
  injectTemplateVariables,
  injectTypescriptVariables,
  injectAdapterVariables,
  injectStdioVariables,
  injectServerInfoVariables,
} from "@/compiler/config/injection";
import { configSchema } from "@/compiler/config";

describe("Config System - Zod Defaults", () => {
  it("should apply defaults when parsing empty config", () => {
    const parsed = configSchema.parse({});
    expect(typeof parsed).toBe("object");
    expect(parsed).not.toBeNull();
  });

  it("should apply HTTP transport defaults", () => {
    const parsed = configSchema.parse({ http: true });
    const resolved = getResolvedHttpConfig(parsed.http);

    expect(resolved).not.toBeNull();
    if (resolved) {
      expect(resolved.port).toBe(3001);
      expect(resolved.host).toBe("127.0.0.1");
      expect(resolved.endpoint).toBe("/mcp");
      expect(resolved.bodySizeLimit).toBe(1024 * 1024 * 10);
      expect(resolved.debug).toBe(false);
      expect(resolved.cors).toBeDefined();
    }
  });

  it("should apply template defaults", () => {
    const parsed = configSchema.parse({ template: {} });
    const resolved = getResolvedTemplateConfig(parsed);

    expect(resolved.name).toBe("xmcp server");
    expect(resolved.description).toBe(
      "This MCP server was bootstrapped with xmcp."
    );
  });

  it("should apply TypeScript defaults", () => {
    const parsed = configSchema.parse({ typescript: {} });
    const resolved = getResolvedTypescriptConfig(parsed);

    expect(resolved.skipTypeCheck).toBe(false);
  });

  it("should apply CORS defaults", () => {
    const httpConfig = getResolvedHttpConfig(true);
    expect(httpConfig).not.toBeNull();

    if (httpConfig) {
      const corsConfig = getResolvedCorsConfig(httpConfig);
      expect(corsConfig.origin).toBe("*");
      expect(corsConfig.methods).toEqual(["GET", "POST"]);
      expect(corsConfig.allowedHeaders).toEqual([
        "Content-Type",
        "Authorization",
        "mcp-session-id",
        "mcp-protocol-version",
        "x-mcp-client-name",
        "x-mcp-client-version",
        "x-mcp-client-title",
        "x-mcp-client-website-url",
        "x-mcp-client-description",
      ]);
      expect(corsConfig.credentials).toBe(false);
      expect(corsConfig.maxAge).toBe(86400);
    }
  });

  it("should preserve client info headers when merging CORS allowedHeaders arrays", () => {
    const httpConfig = getResolvedHttpConfig({
      cors: {
        allowedHeaders: ["Content-Type", "Authorization"],
      },
    });
    expect(httpConfig).not.toBeNull();

    if (httpConfig) {
      const corsConfig = getResolvedCorsConfig(httpConfig);
      expect(corsConfig.allowedHeaders).toEqual([
        "Content-Type",
        "Authorization",
        "mcp-session-id",
        "mcp-protocol-version",
        "x-mcp-client-name",
        "x-mcp-client-version",
        "x-mcp-client-title",
        "x-mcp-client-website-url",
        "x-mcp-client-description",
      ]);
    }
  });
});

describe("Config System - Boolean Transformations", () => {
  it("should transform http: true to object with defaults", () => {
    const resolved = getResolvedHttpConfig(true);

    expect(resolved).not.toBeNull();
    if (resolved) {
      expect(typeof resolved).toBe("object");
      expect(resolved.port).toBe(3001);
      expect(resolved.cors).toBeDefined();
    }
  });

  it("should transform http: false to null", () => {
    const resolved = getResolvedHttpConfig(false);
    expect(resolved).toBeNull();
  });

  it("should transform stdio: true to object with defaults", () => {
    const config = configSchema.parse({ stdio: true });
    const resolved = getResolvedStdioConfig(config);

    expect(resolved).not.toBeNull();
    if (resolved) {
      expect(typeof resolved).toBe("object");
      expect(resolved.debug).toBe(false);
    }
  });

  it("should transform stdio: false to null", () => {
    const config = configSchema.parse({ stdio: false });
    const resolved = getResolvedStdioConfig(config);

    expect(resolved).toBeNull();
  });

  it("should transform paths boolean to string or null", () => {
    const config1 = configSchema.parse({ paths: { tools: true } });
    const resolved1 = getResolvedPathsConfig(config1);
    expect(resolved1.tools).toBe("src/tools");

    const config2 = configSchema.parse({ paths: { tools: false } });
    const resolved2 = getResolvedPathsConfig(config2);
    expect(resolved2.tools).toBeNull();

    const config3 = configSchema.parse({ paths: { tools: "custom/path" } });
    const resolved3 = getResolvedPathsConfig(config3);
    expect(resolved3.tools).toBe("custom/path");
  });
});

describe("Config System - Resolution Functions", () => {
  it("should resolve HTTP config with custom values", () => {
    const resolved = getResolvedHttpConfig({
      port: 8080,
      host: "0.0.0.0",
    });

    expect(resolved).not.toBeNull();
    if (resolved) {
      expect(resolved.port).toBe(8080);
      expect(resolved.host).toBe("0.0.0.0");
      expect(resolved.endpoint).toBe("/mcp");
      expect(resolved.cors).toBeDefined();
    }
  });

  it("should resolve paths config with all fields", () => {
    const config = configSchema.parse({
      paths: {
        tools: "custom/tools",
        prompts: "custom/prompts",
        resources: "custom/resources",
      },
    });
    const resolved = getResolvedPathsConfig(config);

    expect(resolved.tools).toBe("custom/tools");
    expect(resolved.prompts).toBe("custom/prompts");
    expect(resolved.resources).toBe("custom/resources");
  });

  it("should resolve experimental config and extract adapter", () => {
    const config = configSchema.parse({
      experimental: {
        adapter: "express",
      },
    });
    const resolved = getResolvedExperimentalConfig(config);

    expect(resolved.adapter).toBe("express");
  });

  it("should resolve fastify adapter", () => {
    const config = configSchema.parse({
      experimental: {
        adapter: "fastify",
      },
    });
    const resolved = getResolvedExperimentalConfig(config);

    expect(resolved.adapter).toBe("fastify");
  });

  it("should reject unknown adapter values", () => {
    expect(() => {
      configSchema.parse({
        experimental: {
          adapter: "unknown-framework",
        },
      });
    }).toThrow();
  });
});

describe("Config System - Injection Functions", () => {
  it("should inject HTTP variables", () => {
    const variables = injectHttpVariables(true, "development");

    expect(variables.HTTP_CONFIG).toBeDefined();
    const config = JSON.parse(variables.HTTP_CONFIG!);
    expect(config.port).toBe(3001);
    expect(config.debug).toBe(true);
  });

  it("should not inject HTTP variables when http is false", () => {
    const variables = injectHttpVariables(false, "development");
    expect(variables).toEqual({});
  });

  it("should inject CORS variables", () => {
    const httpConfig = getResolvedHttpConfig(true);
    expect(httpConfig).not.toBeNull();

    if (httpConfig) {
      const variables = injectCorsVariables(httpConfig);
      expect(variables.HTTP_CORS_CONFIG).toBeDefined();
      const cors = JSON.parse(variables.HTTP_CORS_CONFIG);
      expect(cors.origin).toBe("*");
    }
  });

  it("should inject all path variables when paths are configured", () => {
    const config = configSchema.parse({
      paths: {
        tools: "src/tools",
        prompts: "src/prompts",
        resources: "src/resources",
      },
    });
    const variables = injectPathsVariables(config);

    expect(variables.TOOLS_PATH).toBeDefined();
    expect(variables.PROMPTS_PATH).toBeDefined();
    expect(variables.RESOURCES_PATH).toBeDefined();
    expect(JSON.parse(variables.TOOLS_PATH!)).toBe("src/tools");
  });

  it("should only inject non-null path variables", () => {
    const config = configSchema.parse({
      paths: {
        tools: "src/tools",
        prompts: false,
        resources: false,
      },
    });
    const variables = injectPathsVariables(config);

    expect(variables.TOOLS_PATH).toBeDefined();
    expect(variables.PROMPTS_PATH).toBeUndefined();
    expect(variables.RESOURCES_PATH).toBeUndefined();
  });

  it("should inject template variables", () => {
    const config = configSchema.parse({ template: {} });
    const variables = injectTemplateVariables(config);

    expect(variables.TEMPLATE_CONFIG).toBeDefined();
    const template = JSON.parse(variables.TEMPLATE_CONFIG);
    expect(template.name).toBe("xmcp server");
  });

  it("should inject TypeScript variables", () => {
    const config = configSchema.parse({ typescript: {} });
    const variables = injectTypescriptVariables(config);

    expect(variables.TYPESCRIPT_CONFIG).toBeDefined();
    const ts = JSON.parse(variables.TYPESCRIPT_CONFIG);
    expect(ts.skipTypeCheck).toBe(false);
  });

  it("should not inject adapter variables when adapter is undefined", () => {
    const config = configSchema.parse({});
    const variables = injectAdapterVariables(config);

    expect(variables).toEqual({});
  });

  it("should inject adapter variables when adapter is configured", () => {
    const config = configSchema.parse({
      experimental: {
        adapter: "nextjs",
      },
    });
    const variables = injectAdapterVariables(config);

    expect(variables.ADAPTER_CONFIG).toBeDefined();
    expect(JSON.parse(variables.ADAPTER_CONFIG!)).toBe("nextjs");
  });

  it("should inject STDIO variables when stdio is configured", () => {
    const config = configSchema.parse({ stdio: { debug: true } });
    const variables = injectStdioVariables(config.stdio);

    expect(variables.STDIO_CONFIG).toBeDefined();
    const stdio = JSON.parse(variables.STDIO_CONFIG!);
    expect(stdio.debug).toBe(true);
  });

  it("should not inject STDIO variables when stdio is undefined", () => {
    const variables = injectStdioVariables(undefined);
    expect(variables).toEqual({});
  });

  it("should inject server info with empty icons when icons not configured", () => {
    const config = configSchema.parse({ template: {} });
    const variables = injectServerInfoVariables(config);

    expect(variables.SERVER_INFO).toBeDefined();
    const serverInfo = JSON.parse(variables.SERVER_INFO);
    expect(serverInfo.name).toBe("xmcp server");
    expect(serverInfo.icons).toEqual([]);
  });

  it("should inject server info with user-supplied icons", () => {
    const config = configSchema.parse({
      template: {
        name: "My Server",
        icons: [{ src: "https://example.com/icon.png", mimeType: "image/png" }],
      },
    });
    const variables = injectServerInfoVariables(config);

    const serverInfo = JSON.parse(variables.SERVER_INFO);
    expect(serverInfo.name).toBe("My Server");
    expect(serverInfo.icons).toEqual([
      { src: "https://example.com/icon.png", mimeType: "image/png" },
    ]);
  });

  it("should inject server info with version as a string", () => {
    const config = configSchema.parse({});
    const variables = injectServerInfoVariables(config);

    const serverInfo = JSON.parse(variables.SERVER_INFO);
    expect(typeof serverInfo.version).toBe("string");
    expect(serverInfo.version).not.toBe("");
  });
});

describe("Config System - Edge Cases", () => {
  it("should handle partial HTTP config", () => {
    const resolved = getResolvedHttpConfig({
      port: 8080,
    });

    expect(resolved).not.toBeNull();
    if (resolved) {
      expect(resolved.port).toBe(8080);
      expect(resolved.host).toBe("127.0.0.1");
      expect(resolved.endpoint).toBe("/mcp");
    }
  });

  it("should handle undefined config gracefully", () => {
    const resolved = getResolvedHttpConfig(undefined);
    expect(resolved).toBeNull();
  });

  it("should handle empty paths config", () => {
    const config = configSchema.parse({ paths: {} });
    const resolved = getResolvedPathsConfig(config);

    expect(resolved.tools).toBe("src/tools");
    expect(resolved.prompts).toBe("src/prompts");
    expect(resolved.resources).toBe("src/resources");
  });

  it("should handle mixed boolean and string paths", () => {
    const config = configSchema.parse({
      paths: {
        tools: true,
        prompts: "custom/prompts",
        resources: false,
      },
    });
    const resolved = getResolvedPathsConfig(config);

    expect(resolved.tools).toBe("src/tools");
    expect(resolved.prompts).toBe("custom/prompts");
    expect(resolved.resources).toBeNull();
  });

  it("should ensure CORS is always present in resolved HTTP config", () => {
    const resolved = getResolvedHttpConfig({
      port: 3001,
    });

    expect(resolved).not.toBeNull();
    if (resolved) {
      expect(resolved.cors).toBeDefined();
      expect(resolved.cors).not.toBeNull();
      expect(typeof resolved.cors).toBe("object");
    }
  });
});

describe("Config System - Backward Compatibility", () => {
  it("should accept boolean http config (backward compatible)", () => {
    expect(getResolvedHttpConfig(true)).not.toBeNull();
    expect(getResolvedHttpConfig(false)).toBeNull();
  });

  it("should accept boolean stdio config (backward compatible)", () => {
    const config = configSchema.parse({ stdio: true });
    expect(getResolvedStdioConfig(config)).not.toBeNull();

    const config2 = configSchema.parse({ stdio: false });
    expect(getResolvedStdioConfig(config2)).toBeNull();
  });

  it("should accept boolean paths config (backward compatible)", () => {
    const config = configSchema.parse({ paths: { tools: true } });
    const resolved = getResolvedPathsConfig(config);
    expect(resolved.tools).toBe("src/tools");
  });
});
