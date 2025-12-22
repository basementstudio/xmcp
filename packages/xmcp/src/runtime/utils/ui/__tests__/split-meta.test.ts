import { describe, it } from "node:test";
import assert from "node:assert";
import {
  splitUIMetaNested,
  isToolMetaKeyNested,
  isResourceMetaKeyNested,
  type SplitMetadata,
} from "../split-meta";

describe("splitUIMetaNested", () => {
  describe("Basic Functionality", () => {
    it("should return empty toolMeta and resourceMeta for empty input", () => {
      const result = splitUIMetaNested({});

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should handle metadata without ui key", () => {
      const meta = {
        someKey: "someValue",
        anotherKey: 123,
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        someKey: "someValue",
        anotherKey: 123,
      });
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should handle metadata with empty ui object", () => {
      const meta = {
        ui: {},
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {});
    });
  });

  describe("Tool Metadata Keys (ui/resourceUri)", () => {
    it("should split ui/resourceUri to toolMeta", () => {
      const meta = {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
        },
      });
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should preserve ui/resourceUri with various URI formats", () => {
      const testCases = [
        "ui://weather-dashboard",
        "ui://weather-server/dashboard-template",
        "ui://my-app/some/nested/path",
      ];

      for (const uri of testCases) {
        const meta = {
          ui: {
            "ui/resourceUri": uri,
          },
        };
        const result = splitUIMetaNested(meta);

        assert.deepStrictEqual(
          result.toolMeta.ui?.["ui/resourceUri"],
          uri,
          `Failed for URI: ${uri}`
        );
      }
    });
  });

  describe("Resource Metadata Keys (CSP and Display)", () => {
    it("should split prefersBorder to resourceMeta", () => {
      const meta = {
        ui: {
          prefersBorder: true,
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          prefersBorder: true,
        },
      });
    });

    it("should split domain to resourceMeta", () => {
      const meta = {
        ui: {
          domain: "https://weather-widget.example.com",
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          domain: "https://weather-widget.example.com",
        },
      });
    });

    it("should split csp to resourceMeta", () => {
      const meta = {
        ui: {
          csp: {
            connectDomains: ["https://api.weather.com"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          csp: {
            connectDomains: ["https://api.weather.com"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
        },
      });
    });

    it("should split connectDomains to resourceMeta", () => {
      const meta = {
        ui: {
          connectDomains: ["https://api.openweathermap.org", "wss://realtime.service.com"],
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          connectDomains: ["https://api.openweathermap.org", "wss://realtime.service.com"],
        },
      });
    });

    it("should split resourceDomains to resourceMeta", () => {
      const meta = {
        ui: {
          resourceDomains: ["https://cdn.jsdelivr.net", "https://*.cloudflare.com"],
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          resourceDomains: ["https://cdn.jsdelivr.net", "https://*.cloudflare.com"],
        },
      });
    });

    it("should split all resource metadata keys together", () => {
      const meta = {
        ui: {
          prefersBorder: true,
          domain: "https://my-widget.example.com",
          csp: {
            connectDomains: ["https://api.example.com"],
          },
          connectDomains: ["https://backup-api.example.com"],
          resourceDomains: ["https://cdn.example.com"],
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          prefersBorder: true,
          domain: "https://my-widget.example.com",
          csp: {
            connectDomains: ["https://api.example.com"],
          },
          connectDomains: ["https://backup-api.example.com"],
          resourceDomains: ["https://cdn.example.com"],
        },
      });
    });
  });

  describe("Mixed Tool and Resource Metadata", () => {
    it("should correctly split mixed tool and resource metadata", () => {
      const meta = {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
          prefersBorder: true,
          domain: "https://weather-widget.example.com",
          csp: {
            connectDomains: ["https://api.openweathermap.org"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
        },
      });
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          prefersBorder: true,
          domain: "https://weather-widget.example.com",
          csp: {
            connectDomains: ["https://api.openweathermap.org"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
        },
      });
    });

    it("should handle complete SEP-1865 tool metadata example", () => {
      // Example from SEP-1865 specification
      const meta = {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard-template",
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard-template",
        },
      });
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should handle complete SEP-1865 resource metadata example", () => {
      // Example from SEP-1865 specification
      const meta = {
        ui: {
          csp: {
            connectDomains: ["https://api.openweathermap.org"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
          prefersBorder: true,
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          csp: {
            connectDomains: ["https://api.openweathermap.org"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
          prefersBorder: true,
        },
      });
    });
  });

  describe("Unknown Keys (Default to Tool Metadata)", () => {
    it("should put unknown ui keys in toolMeta", () => {
      const meta = {
        ui: {
          unknownKey: "someValue",
          anotherUnknown: { nested: true },
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          unknownKey: "someValue",
          anotherUnknown: { nested: true },
        },
      });
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should put unknown keys alongside known tool keys", () => {
      const meta = {
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
          customExtension: "customValue",
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
          customExtension: "customValue",
        },
      });
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should handle mixed known and unknown keys", () => {
      const meta = {
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
          prefersBorder: false,
          customToolProperty: "value",
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
          customToolProperty: "value",
        },
      });
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          prefersBorder: false,
        },
      });
    });
  });

  describe("Non-UI Metadata Preservation", () => {
    it("should preserve non-ui metadata in toolMeta", () => {
      const meta = {
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
        version: "1.0.0",
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
        version: "1.0.0",
      });
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should preserve non-ui metadata alongside ui metadata", () => {
      const meta = {
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
          prefersBorder: true,
        },
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
        },
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
      });
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          prefersBorder: true,
        },
      });
    });

    it("should handle _meta pattern from SEP-1865", () => {
      // Test the _meta pattern used in tool results
      const _meta = {
        ui: {
          csp: {
            connectDomains: ["https://api.example.com"],
            resourceDomains: ["https://cdn.example.com"],
          },
          prefersBorder: true,
        },
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
      };
      const result = splitUIMetaNested(_meta);

      assert.deepStrictEqual(result.toolMeta, {
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
      });
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          csp: {
            connectDomains: ["https://api.example.com"],
            resourceDomains: ["https://cdn.example.com"],
          },
          prefersBorder: true,
        },
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle ui key that is not an object", () => {
      const meta = {
        ui: "not-an-object",
      };
      const result = splitUIMetaNested(meta as any);

      // ui is not an object, so the check `typeof meta.ui === "object"` fails
      // and the ui key is not processed. Since non-ui keys go to toolMeta
      // via the second loop, but the second loop skips `ui` key, result is empty.
      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should handle ui key that is null", () => {
      const meta = {
        ui: null,
      };
      const result = splitUIMetaNested(meta as any);

      // null passes `typeof meta.ui === "object"` but fails Object.entries iteration
      // The second loop skips `ui` key, so result is empty
      assert.deepStrictEqual(result.toolMeta, {});
      assert.deepStrictEqual(result.resourceMeta, {});
    });

    it("should handle ui key that is an array", () => {
      const meta = {
        ui: ["not", "an", "object"],
      };
      const result = splitUIMetaNested(meta as any);

      // Arrays are objects in JS, but the iteration will work differently
      assert.deepStrictEqual(result.toolMeta.ui, {
        "0": "not",
        "1": "an",
        "2": "object",
      });
    });

    it("should handle deeply nested values in ui metadata", () => {
      const meta = {
        ui: {
          csp: {
            connectDomains: ["https://api.example.com"],
            resourceDomains: ["https://cdn.example.com"],
            nested: {
              deeply: {
                value: true,
              },
            },
          },
        },
      };
      const result = splitUIMetaNested(meta);

      // csp is a resource key, so entire object goes to resourceMeta
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          csp: {
            connectDomains: ["https://api.example.com"],
            resourceDomains: ["https://cdn.example.com"],
            nested: {
              deeply: {
                value: true,
              },
            },
          },
        },
      });
    });

    it("should handle prefersBorder with false value", () => {
      const meta = {
        ui: {
          prefersBorder: false,
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          prefersBorder: false,
        },
      });
    });

    it("should handle empty arrays in CSP domains", () => {
      const meta = {
        ui: {
          connectDomains: [],
          resourceDomains: [],
        },
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          connectDomains: [],
          resourceDomains: [],
        },
      });
    });
  });

  describe("Return Type Validation", () => {
    it("should return object conforming to SplitMetadata interface", () => {
      const meta = {
        ui: {
          "ui/resourceUri": "ui://test/widget",
          prefersBorder: true,
        },
      };
      const result: SplitMetadata = splitUIMetaNested(meta);

      assert.ok("toolMeta" in result);
      assert.ok("resourceMeta" in result);
      assert.strictEqual(typeof result.toolMeta, "object");
      assert.strictEqual(typeof result.resourceMeta, "object");
    });
  });
});

describe("isToolMetaKeyNested", () => {
  it("should return true for ui/resourceUri", () => {
    assert.strictEqual(isToolMetaKeyNested("ui/resourceUri"), true);
  });

  it("should return false for resource metadata keys", () => {
    assert.strictEqual(isToolMetaKeyNested("prefersBorder"), false);
    assert.strictEqual(isToolMetaKeyNested("domain"), false);
    assert.strictEqual(isToolMetaKeyNested("csp"), false);
    assert.strictEqual(isToolMetaKeyNested("connectDomains"), false);
    assert.strictEqual(isToolMetaKeyNested("resourceDomains"), false);
  });

  it("should return false for unknown keys", () => {
    assert.strictEqual(isToolMetaKeyNested("unknownKey"), false);
    assert.strictEqual(isToolMetaKeyNested("customProperty"), false);
    assert.strictEqual(isToolMetaKeyNested(""), false);
  });

  it("should be case-sensitive", () => {
    assert.strictEqual(isToolMetaKeyNested("ui/resourceUri"), true);
    assert.strictEqual(isToolMetaKeyNested("UI/RESOURCEURI"), false);
    assert.strictEqual(isToolMetaKeyNested("Ui/ResourceUri"), false);
  });
});

describe("isResourceMetaKeyNested", () => {
  it("should return true for prefersBorder", () => {
    assert.strictEqual(isResourceMetaKeyNested("prefersBorder"), true);
  });

  it("should return true for domain", () => {
    assert.strictEqual(isResourceMetaKeyNested("domain"), true);
  });

  it("should return true for csp", () => {
    assert.strictEqual(isResourceMetaKeyNested("csp"), true);
  });

  it("should return true for connectDomains", () => {
    assert.strictEqual(isResourceMetaKeyNested("connectDomains"), true);
  });

  it("should return true for resourceDomains", () => {
    assert.strictEqual(isResourceMetaKeyNested("resourceDomains"), true);
  });

  it("should return false for tool metadata keys", () => {
    assert.strictEqual(isResourceMetaKeyNested("ui/resourceUri"), false);
  });

  it("should return false for unknown keys", () => {
    assert.strictEqual(isResourceMetaKeyNested("unknownKey"), false);
    assert.strictEqual(isResourceMetaKeyNested("customProperty"), false);
    assert.strictEqual(isResourceMetaKeyNested(""), false);
  });

  it("should be case-sensitive", () => {
    assert.strictEqual(isResourceMetaKeyNested("prefersBorder"), true);
    assert.strictEqual(isResourceMetaKeyNested("PrefersBorder"), false);
    assert.strictEqual(isResourceMetaKeyNested("PREFERSBORDER"), false);

    assert.strictEqual(isResourceMetaKeyNested("connectDomains"), true);
    assert.strictEqual(isResourceMetaKeyNested("ConnectDomains"), false);
  });
});

describe("SEP-1865 Protocol Compliance", () => {
  describe("UIResource Metadata Splitting", () => {
    it("should correctly handle UIResourceMeta structure", () => {
      // Full UIResourceMeta as defined in SEP-1865
      const meta = {
        ui: {
          csp: {
            connectDomains: ["https://api.weather.com", "wss://realtime.service.com"],
            resourceDomains: ["https://cdn.jsdelivr.net", "https://*.cloudflare.com"],
          },
          domain: "https://weather-widget.example.com",
          prefersBorder: true,
        },
      };
      const result = splitUIMetaNested(meta);

      // All these should go to resourceMeta per SEP-1865
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          csp: {
            connectDomains: ["https://api.weather.com", "wss://realtime.service.com"],
            resourceDomains: ["https://cdn.jsdelivr.net", "https://*.cloudflare.com"],
          },
          domain: "https://weather-widget.example.com",
          prefersBorder: true,
        },
      });
      assert.deepStrictEqual(result.toolMeta, {});
    });
  });

  describe("Tool Metadata with ui/resourceUri", () => {
    it("should correctly handle Tool _meta with ui/resourceUri", () => {
      // Tool metadata as defined in SEP-1865
      const toolMeta = {
        "ui/resourceUri": "ui://weather-server/dashboard-template",
      };

      // When wrapped in ui key for nested format
      const meta = {
        ui: toolMeta,
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard-template",
        },
      });
    });
  });

  describe("Resource Content Metadata Splitting", () => {
    it("should split resources/read response _meta correctly", () => {
      // From SEP-1865 resources/read response example
      const contentMeta = {
        ui: {
          csp: {
            connectDomains: ["https://api.openweathermap.org"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
          prefersBorder: true,
        },
      };
      const result = splitUIMetaNested(contentMeta);

      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          csp: {
            connectDomains: ["https://api.openweathermap.org"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
          prefersBorder: true,
        },
      });
      assert.deepStrictEqual(result.toolMeta, {});
    });
  });

  describe("HostContext Metadata (Not Split)", () => {
    it("should preserve non-ui metadata that might come from HostContext", () => {
      // HostContext fields from SEP-1865 should be preserved in toolMeta
      const meta = {
        theme: "dark",
        displayMode: "inline",
        viewport: { width: 400, height: 300 },
        locale: "en-US",
        timeZone: "America/New_York",
      };
      const result = splitUIMetaNested(meta);

      assert.deepStrictEqual(result.toolMeta, meta);
      assert.deepStrictEqual(result.resourceMeta, {});
    });
  });

  describe("Tool Result _meta Splitting", () => {
    it("should handle tool result _meta with mixed content", () => {
      // From SEP-1865 tool result example
      const toolResultMeta = {
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
        ui: {
          "ui/resourceUri": "ui://weather/display",
        },
      };
      const result = splitUIMetaNested(toolResultMeta);

      assert.deepStrictEqual(result.toolMeta, {
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
        ui: {
          "ui/resourceUri": "ui://weather/display",
        },
      });
      assert.deepStrictEqual(result.resourceMeta, {});
    });
  });

  describe("Combined Tool and Resource Registration", () => {
    it("should handle metadata for both tool and associated resource", () => {
      // When a tool references a resource, we need to split the metadata
      // for proper association
      const combinedMeta = {
        ui: {
          // Tool-specific: tells the host which UI resource to use
          "ui/resourceUri": "ui://weather-server/dashboard",
          // Resource-specific: CSP and display preferences for the resource
          csp: {
            connectDomains: ["https://api.weather.com"],
            resourceDomains: ["https://cdn.example.com"],
          },
          prefersBorder: true,
          domain: "https://weather.example.com",
        },
        // Non-UI metadata
        version: "2.0.0",
      };
      const result = splitUIMetaNested(combinedMeta);

      // Tool gets: ui/resourceUri and non-UI metadata
      assert.deepStrictEqual(result.toolMeta, {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
        },
        version: "2.0.0",
      });

      // Resource gets: CSP, domain, and display preferences
      assert.deepStrictEqual(result.resourceMeta, {
        ui: {
          csp: {
            connectDomains: ["https://api.weather.com"],
            resourceDomains: ["https://cdn.example.com"],
          },
          prefersBorder: true,
          domain: "https://weather.example.com",
        },
      });
    });
  });
});
