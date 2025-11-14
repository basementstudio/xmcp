import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getResolvedHttpConfig,
  getResolvedStdioConfig,
  getResolvedPathsConfig,
  getResolvedTemplateConfig,
  getResolvedTypescriptConfig,
  getResolvedOAuthConfig,
  getResolvedExperimentalConfig,
  getResolvedCorsConfig,
} from "../utils";
import {
  injectHttpVariables,
  injectCorsVariables,
  injectPathsVariables,
  injectOAuthVariables,
  injectTemplateVariables,
  injectTypescriptVariables,
  injectAdapterVariables,
  injectStdioVariables,
} from "../injection";
import { configSchema } from "../index";
import type { XmcpConfigOuputSchema } from "../index";

describe("Config System - Zod Defaults", () => {
  it("should apply defaults when parsing empty config", () => {
    const parsed = configSchema.parse({});

    // All fields should be optional, so empty object should be valid
    assert.equal(typeof parsed, "object");
    assert.equal(parsed !== null, true);
  });

  it("should apply HTTP transport defaults", () => {
    const parsed = configSchema.parse({ http: true });
    const resolved = getResolvedHttpConfig(parsed.http);

    assert.notEqual(resolved, null);
    if (resolved) {
      assert.equal(resolved.port, 3001);
      assert.equal(resolved.host, "127.0.0.1");
      assert.equal(resolved.endpoint, "/mcp");
      assert.equal(resolved.bodySizeLimit, 1024 * 1024 * 10);
      assert.equal(resolved.debug, false);
      assert.notEqual(resolved.cors, undefined);
    }
  });

  it("should apply template defaults", () => {
    const parsed = configSchema.parse({ template: {} });
    const resolved = getResolvedTemplateConfig(parsed);

    assert.equal(resolved.name, "xmcp server");
    assert.equal(
      resolved.description,
      "This MCP server was bootstrapped with xmcp. Click the button below to connect to the endpoint."
    );
  });

  it("should apply TypeScript defaults", () => {
    const parsed = configSchema.parse({ typescript: {} });
    const resolved = getResolvedTypescriptConfig(parsed);

    assert.equal(resolved.skipTypeCheck, false);
  });

  it("should apply CORS defaults", () => {
    const httpConfig = getResolvedHttpConfig(true);
    assert.notEqual(httpConfig, null);

    if (httpConfig) {
      const corsConfig = getResolvedCorsConfig(httpConfig);
      assert.equal(corsConfig.origin, "*");
      assert.deepEqual(corsConfig.methods, ["GET", "POST"]);
      assert.equal(corsConfig.credentials, false);
      assert.equal(corsConfig.maxAge, 86400);
    }
  });
});

describe("Config System - Boolean Transformations", () => {
  it("should transform http: true to object with defaults", () => {
    const resolved = getResolvedHttpConfig(true);

    assert.notEqual(resolved, null);
    if (resolved) {
      assert.equal(typeof resolved, "object");
      assert.equal(resolved.port, 3001);
      assert.notEqual(resolved.cors, undefined);
    }
  });

  it("should transform http: false to null", () => {
    const resolved = getResolvedHttpConfig(false);
    assert.equal(resolved, null);
  });

  it("should transform stdio: true to object with defaults", () => {
    const config = configSchema.parse({ stdio: true });
    const resolved = getResolvedStdioConfig(config);

    assert.notEqual(resolved, null);
    if (resolved) {
      assert.equal(typeof resolved, "object");
      assert.equal(resolved.debug, false);
    }
  });

  it("should transform stdio: false to null", () => {
    const config = configSchema.parse({ stdio: false });
    const resolved = getResolvedStdioConfig(config);

    assert.equal(resolved, null);
  });

  it("should transform paths boolean to string or null", () => {
    const config1 = configSchema.parse({ paths: { tools: true } });
    const resolved1 = getResolvedPathsConfig(config1);
    assert.equal(resolved1.tools, "src/tools");

    const config2 = configSchema.parse({ paths: { tools: false } });
    const resolved2 = getResolvedPathsConfig(config2);
    assert.equal(resolved2.tools, null);

    const config3 = configSchema.parse({ paths: { tools: "custom/path" } });
    const resolved3 = getResolvedPathsConfig(config3);
    assert.equal(resolved3.tools, "custom/path");
  });
});

describe("Config System - Resolution Functions", () => {
  it("should resolve HTTP config with custom values", () => {
    const resolved = getResolvedHttpConfig({
      port: 8080,
      host: "0.0.0.0",
    });

    assert.notEqual(resolved, null);
    if (resolved) {
      assert.equal(resolved.port, 8080);
      assert.equal(resolved.host, "0.0.0.0");
      // Defaults should still apply
      assert.equal(resolved.endpoint, "/mcp");
      assert.notEqual(resolved.cors, undefined);
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

    assert.equal(resolved.tools, "custom/tools");
    assert.equal(resolved.prompts, "custom/prompts");
    assert.equal(resolved.resources, "custom/resources");
  });

  it("should resolve experimental config and extract adapter", () => {
    const config = configSchema.parse({
      experimental: {
        adapter: "express",
      },
    });
    const resolved = getResolvedExperimentalConfig(config);

    assert.equal(resolved.adapter, "express");
  });

  it("should resolve OAuth config or return null", () => {
    const config1 = configSchema.parse({
      experimental: {
        oauth: {
          issuerUrl: "https://example.com",
          baseUrl: "https://app.example.com",
          endpoints: {
            authorizationUrl: "/oauth/authorize",
            tokenUrl: "/oauth/token",
            registerUrl: "/oauth/register",
          },
        },
      },
    });
    const resolved1 = getResolvedOAuthConfig(config1);
    assert.notEqual(resolved1, null);

    const config2 = configSchema.parse({});
    const resolved2 = getResolvedOAuthConfig(config2);
    assert.equal(resolved2, null);
  });
});

describe("Config System - Injection Functions", () => {
  it("should inject HTTP variables", () => {
    const variables = injectHttpVariables(true, "development");

    assert.notEqual(variables.HTTP_CONFIG, undefined);
    const config = JSON.parse(variables.HTTP_CONFIG!);
    assert.equal(config.port, 3001);
    assert.equal(config.debug, true); // mode === "development"
    assert.equal(config.stateless, true);
  });

  it("should not inject HTTP variables when http is false", () => {
    const variables = injectHttpVariables(false, "development");
    assert.deepEqual(variables, {});
  });

  it("should inject CORS variables", () => {
    const httpConfig = getResolvedHttpConfig(true);
    assert.notEqual(httpConfig, null);

    if (httpConfig) {
      const variables = injectCorsVariables(httpConfig);
      assert.notEqual(variables.HTTP_CORS_CONFIG, undefined);
      const cors = JSON.parse(variables.HTTP_CORS_CONFIG);
      assert.equal(cors.origin, "*");
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

    assert.notEqual(variables.TOOLS_PATH, undefined);
    assert.notEqual(variables.PROMPTS_PATH, undefined);
    assert.notEqual(variables.RESOURCES_PATH, undefined);
    assert.equal(JSON.parse(variables.TOOLS_PATH), "src/tools");
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

    assert.notEqual(variables.TOOLS_PATH, undefined);
    assert.equal(variables.PROMPTS_PATH, undefined);
    assert.equal(variables.RESOURCES_PATH, undefined);
  });

  it("should inject OAuth variables as undefined when oauth is null", () => {
    const config = configSchema.parse({});
    const variables = injectOAuthVariables(config);

    // OAUTH_CONFIG should always be injected (runtime expects it)
    // When oauth is not configured, it's injected as "undefined"
    assert.notEqual(variables.OAUTH_CONFIG, undefined);
    assert.equal(variables.OAUTH_CONFIG, "undefined");
  });

  it("should inject OAuth variables when oauth is configured", () => {
    const config = configSchema.parse({
      experimental: {
        oauth: {
          issuerUrl: "https://example.com",
          baseUrl: "https://app.example.com",
          endpoints: {
            authorizationUrl: "/oauth/authorize",
            tokenUrl: "/oauth/token",
            registerUrl: "/oauth/register",
          },
        },
      },
    });
    const variables = injectOAuthVariables(config);

    assert.notEqual(variables.OAUTH_CONFIG, undefined);
    const oauth = JSON.parse(variables.OAUTH_CONFIG);
    assert.equal(oauth.issuerUrl, "https://example.com");
    assert.equal(oauth.baseUrl, "https://app.example.com");
  });

  it("should inject template variables", () => {
    const config = configSchema.parse({ template: {} });
    const variables = injectTemplateVariables(config);

    assert.notEqual(variables.TEMPLATE_CONFIG, undefined);
    const template = JSON.parse(variables.TEMPLATE_CONFIG);
    assert.equal(template.name, "xmcp server");
  });

  it("should inject TypeScript variables", () => {
    const config = configSchema.parse({ typescript: {} });
    const variables = injectTypescriptVariables(config);

    assert.notEqual(variables.TYPESCRIPT_CONFIG, undefined);
    const ts = JSON.parse(variables.TYPESCRIPT_CONFIG);
    assert.equal(ts.skipTypeCheck, false);
  });

  it("should not inject adapter variables when adapter is undefined", () => {
    const config = configSchema.parse({});
    const variables = injectAdapterVariables(config);

    assert.deepEqual(variables, {});
  });

  it("should inject adapter variables when adapter is configured", () => {
    const config = configSchema.parse({
      experimental: {
        adapter: "nextjs",
      },
    });
    const variables = injectAdapterVariables(config);

    assert.notEqual(variables.ADAPTER_CONFIG, undefined);
    assert.equal(JSON.parse(variables.ADAPTER_CONFIG!), "nextjs");
  });

  it("should inject STDIO variables when stdio is configured", () => {
    const config = configSchema.parse({ stdio: { debug: true } });
    const variables = injectStdioVariables(config.stdio);

    assert.notEqual(variables.STDIO_CONFIG, undefined);
    const stdio = JSON.parse(variables.STDIO_CONFIG!);
    assert.equal(stdio.debug, true);
  });

  it("should not inject STDIO variables when stdio is undefined", () => {
    const variables = injectStdioVariables(undefined);
    assert.deepEqual(variables, {});
  });
});

describe("Config System - Edge Cases", () => {
  it("should handle partial HTTP config", () => {
    const resolved = getResolvedHttpConfig({
      port: 8080,
      // Other fields should use defaults
    });

    assert.notEqual(resolved, null);
    if (resolved) {
      assert.equal(resolved.port, 8080);
      assert.equal(resolved.host, "127.0.0.1"); // default
      assert.equal(resolved.endpoint, "/mcp"); // default
    }
  });

  it("should handle undefined config gracefully", () => {
    const resolved = getResolvedHttpConfig(undefined);
    assert.equal(resolved, null);
  });

  it("should handle empty paths config", () => {
    const config = configSchema.parse({ paths: {} });
    const resolved = getResolvedPathsConfig(config);

    // Should use defaults (true -> default paths)
    assert.equal(resolved.tools, "src/tools");
    assert.equal(resolved.prompts, "src/prompts");
    assert.equal(resolved.resources, "src/resources");
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

    assert.equal(resolved.tools, "src/tools"); // true -> default
    assert.equal(resolved.prompts, "custom/prompts"); // string -> string
    assert.equal(resolved.resources, null); // false -> null
  });

  it("should ensure CORS is always present in resolved HTTP config", () => {
    const resolved = getResolvedHttpConfig({
      port: 3001,
      // cors not specified
    });

    assert.notEqual(resolved, null);
    if (resolved) {
      assert.notEqual(resolved.cors, undefined);
      assert.notEqual(resolved.cors, null);
      assert.equal(typeof resolved.cors, "object");
    }
  });
});

describe("Config System - Backward Compatibility", () => {
  it("should accept boolean http config (backward compatible)", () => {
    const resolved = getResolvedHttpConfig(true);
    assert.notEqual(resolved, null);

    const resolved2 = getResolvedHttpConfig(false);
    assert.equal(resolved2, null);
  });

  it("should accept boolean stdio config (backward compatible)", () => {
    const config = configSchema.parse({ stdio: true });
    const resolved = getResolvedStdioConfig(config);
    assert.notEqual(resolved, null);

    const config2 = configSchema.parse({ stdio: false });
    const resolved2 = getResolvedStdioConfig(config2);
    assert.equal(resolved2, null);
  });

  it("should accept boolean paths config (backward compatible)", () => {
    const config = configSchema.parse({ paths: { tools: true } });
    const resolved = getResolvedPathsConfig(config);
    assert.equal(resolved.tools, "src/tools");
  });
});
