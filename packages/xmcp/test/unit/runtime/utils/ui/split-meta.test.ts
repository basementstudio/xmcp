import { describe, it, expect } from "vitest";
import {
  splitUIMetaNested,
  isToolMetaKeyNested,
  isResourceMetaKeyNested,
  type SplitMetadata,
} from "@/runtime/utils/ui/split-meta";

describe("splitUIMetaNested", () => {
  describe("Basic Functionality", () => {
    it("should return empty toolMeta and resourceMeta for empty input", () => {
      const result = splitUIMetaNested({});

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({});
    });

    it("should handle metadata without ui key", () => {
      const meta = {
        someKey: "someValue",
        anotherKey: 123,
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({
        someKey: "someValue",
        anotherKey: 123,
      });
      expect(result.resourceMeta).toEqual({});
    });

    it("should handle metadata with empty ui object", () => {
      const meta = {
        ui: {},
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({});
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

      expect(result.toolMeta).toEqual({
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
        },
      });
      expect(result.resourceMeta).toEqual({});
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

        expect(result.toolMeta.ui?.["ui/resourceUri"]).toBe(uri);
      }
    });

    it("should split visibility to toolMeta", () => {
      const meta = {
        ui: {
          visibility: ["model", "app"],
        },
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({
        ui: {
          visibility: ["model", "app"],
        },
      });
      expect(result.resourceMeta).toEqual({});
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

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({
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

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({
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
            frameDomains: ["https://widgets.example.com"],
            baseUriDomains: ["https://assets.example.com"],
          },
        },
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({
        ui: {
          csp: {
            connectDomains: ["https://api.weather.com"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
            frameDomains: ["https://widgets.example.com"],
            baseUriDomains: ["https://assets.example.com"],
          },
        },
      });
    });

    it("should split permissions to resourceMeta", () => {
      const meta = {
        ui: {
          permissions: {
            camera: {},
            microphone: {},
          },
        },
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({
        ui: {
          permissions: {
            camera: {},
            microphone: {},
          },
        },
      });
    });

    it("should split connectDomains to resourceMeta", () => {
      const meta = {
        ui: {
          connectDomains: [
            "https://api.openweathermap.org",
            "wss://realtime.service.com",
          ],
        },
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({
        ui: {
          connectDomains: [
            "https://api.openweathermap.org",
            "wss://realtime.service.com",
          ],
        },
      });
    });

    it("should split resourceDomains to resourceMeta", () => {
      const meta = {
        ui: {
          resourceDomains: [
            "https://cdn.jsdelivr.net",
            "https://*.cloudflare.com",
          ],
        },
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({
        ui: {
          resourceDomains: [
            "https://cdn.jsdelivr.net",
            "https://*.cloudflare.com",
          ],
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

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({
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

      expect(result.toolMeta).toEqual({
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
        },
      });
      expect(result.resourceMeta).toEqual({
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
      const meta = {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard-template",
        },
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard-template",
        },
      });
      expect(result.resourceMeta).toEqual({});
    });

    it("should handle complete SEP-1865 resource metadata example", () => {
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

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({
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

      expect(result.toolMeta).toEqual({
        ui: {
          unknownKey: "someValue",
          anotherUnknown: { nested: true },
        },
      });
      expect(result.resourceMeta).toEqual({});
    });

    it("should put unknown keys alongside known tool keys", () => {
      const meta = {
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
          customExtension: "customValue",
        },
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
          customExtension: "customValue",
        },
      });
      expect(result.resourceMeta).toEqual({});
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

      expect(result.toolMeta).toEqual({
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
          customToolProperty: "value",
        },
      });
      expect(result.resourceMeta).toEqual({
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

      expect(result.toolMeta).toEqual({
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
        version: "1.0.0",
      });
      expect(result.resourceMeta).toEqual({});
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

      expect(result.toolMeta).toEqual({
        ui: {
          "ui/resourceUri": "ui://my-app/widget",
        },
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
      });
      expect(result.resourceMeta).toEqual({
        ui: {
          prefersBorder: true,
        },
      });
    });

    it("should handle _meta pattern from SEP-1865", () => {
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

      expect(result.toolMeta).toEqual({
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
      });
      expect(result.resourceMeta).toEqual({
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

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({});
    });

    it("should handle ui key that is null", () => {
      const meta = {
        ui: null,
      };
      const result = splitUIMetaNested(meta as any);

      expect(result.toolMeta).toEqual({});
      expect(result.resourceMeta).toEqual({});
    });

    it("should handle ui key that is an array", () => {
      const meta = {
        ui: ["not", "an", "object"],
      };
      const result = splitUIMetaNested(meta as any);

      expect(result.toolMeta.ui).toEqual({
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

      expect(result.resourceMeta).toEqual({
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

      expect(result.resourceMeta).toEqual({
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

      expect(result.resourceMeta).toEqual({
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

      expect("toolMeta" in result).toBe(true);
      expect("resourceMeta" in result).toBe(true);
      expect(typeof result.toolMeta).toBe("object");
      expect(typeof result.resourceMeta).toBe("object");
    });
  });
});

describe("isToolMetaKeyNested", () => {
  it("should return true for ui/resourceUri", () => {
    expect(isToolMetaKeyNested("ui/resourceUri")).toBe(true);
  });

  it("should return false for resource metadata keys", () => {
    expect(isToolMetaKeyNested("prefersBorder")).toBe(false);
    expect(isToolMetaKeyNested("domain")).toBe(false);
    expect(isToolMetaKeyNested("csp")).toBe(false);
    expect(isToolMetaKeyNested("connectDomains")).toBe(false);
    expect(isToolMetaKeyNested("resourceDomains")).toBe(false);
  });

  it("should return false for unknown keys", () => {
    expect(isToolMetaKeyNested("unknownKey")).toBe(false);
    expect(isToolMetaKeyNested("customProperty")).toBe(false);
    expect(isToolMetaKeyNested("")).toBe(false);
  });

  it("should be case-sensitive", () => {
    expect(isToolMetaKeyNested("ui/resourceUri")).toBe(true);
    expect(isToolMetaKeyNested("UI/RESOURCEURI")).toBe(false);
    expect(isToolMetaKeyNested("Ui/ResourceUri")).toBe(false);
  });
});

describe("isResourceMetaKeyNested", () => {
  it("should return true for prefersBorder", () => {
    expect(isResourceMetaKeyNested("prefersBorder")).toBe(true);
  });

  it("should return true for domain", () => {
    expect(isResourceMetaKeyNested("domain")).toBe(true);
  });

  it("should return true for csp", () => {
    expect(isResourceMetaKeyNested("csp")).toBe(true);
  });

  it("should return true for connectDomains", () => {
    expect(isResourceMetaKeyNested("connectDomains")).toBe(true);
  });

  it("should return true for resourceDomains", () => {
    expect(isResourceMetaKeyNested("resourceDomains")).toBe(true);
  });

  it("should return false for tool metadata keys", () => {
    expect(isResourceMetaKeyNested("ui/resourceUri")).toBe(false);
  });

  it("should return false for unknown keys", () => {
    expect(isResourceMetaKeyNested("unknownKey")).toBe(false);
    expect(isResourceMetaKeyNested("customProperty")).toBe(false);
    expect(isResourceMetaKeyNested("")).toBe(false);
  });

  it("should be case-sensitive", () => {
    expect(isResourceMetaKeyNested("prefersBorder")).toBe(true);
    expect(isResourceMetaKeyNested("PrefersBorder")).toBe(false);
    expect(isResourceMetaKeyNested("PREFERSBORDER")).toBe(false);

    expect(isResourceMetaKeyNested("connectDomains")).toBe(true);
    expect(isResourceMetaKeyNested("ConnectDomains")).toBe(false);
  });
});

describe("SEP-1865 Protocol Compliance", () => {
  describe("UIResource Metadata Splitting", () => {
    it("should correctly handle UIResourceMeta structure", () => {
      const meta = {
        ui: {
          csp: {
            connectDomains: [
              "https://api.weather.com",
              "wss://realtime.service.com",
            ],
            resourceDomains: [
              "https://cdn.jsdelivr.net",
              "https://*.cloudflare.com",
            ],
          },
          domain: "https://weather-widget.example.com",
          prefersBorder: true,
        },
      };
      const result = splitUIMetaNested(meta);

      expect(result.resourceMeta).toEqual({
        ui: {
          csp: {
            connectDomains: [
              "https://api.weather.com",
              "wss://realtime.service.com",
            ],
            resourceDomains: [
              "https://cdn.jsdelivr.net",
              "https://*.cloudflare.com",
            ],
          },
          domain: "https://weather-widget.example.com",
          prefersBorder: true,
        },
      });
      expect(result.toolMeta).toEqual({});
    });
  });

  describe("Tool Metadata with ui/resourceUri", () => {
    it("should correctly handle Tool _meta with ui/resourceUri", () => {
      const toolMeta = {
        "ui/resourceUri": "ui://weather-server/dashboard-template",
      };

      const meta = {
        ui: toolMeta,
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual({
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard-template",
        },
      });
    });
  });

  describe("Resource Content Metadata Splitting", () => {
    it("should split resources/read response _meta correctly", () => {
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

      expect(result.resourceMeta).toEqual({
        ui: {
          csp: {
            connectDomains: ["https://api.openweathermap.org"],
            resourceDomains: ["https://cdn.jsdelivr.net"],
          },
          prefersBorder: true,
        },
      });
      expect(result.toolMeta).toEqual({});
    });
  });

  describe("HostContext Metadata (Not Split)", () => {
    it("should preserve non-ui metadata that might come from HostContext", () => {
      const meta = {
        theme: "dark",
        displayMode: "inline",
        viewport: { width: 400, height: 300 },
        locale: "en-US",
        timeZone: "America/New_York",
      };
      const result = splitUIMetaNested(meta);

      expect(result.toolMeta).toEqual(meta);
      expect(result.resourceMeta).toEqual({});
    });
  });

  describe("Tool Result _meta Splitting", () => {
    it("should handle tool result _meta with mixed content", () => {
      const toolResultMeta = {
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
        ui: {
          "ui/resourceUri": "ui://weather/display",
        },
      };
      const result = splitUIMetaNested(toolResultMeta);

      expect(result.toolMeta).toEqual({
        timestamp: "2025-11-10T15:30:00Z",
        source: "weather-api",
        ui: {
          "ui/resourceUri": "ui://weather/display",
        },
      });
      expect(result.resourceMeta).toEqual({});
    });
  });

  describe("Combined Tool and Resource Registration", () => {
    it("should handle metadata for both tool and associated resource", () => {
      const combinedMeta = {
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
          csp: {
            connectDomains: ["https://api.weather.com"],
            resourceDomains: ["https://cdn.example.com"],
          },
          prefersBorder: true,
          domain: "https://weather.example.com",
        },
        version: "2.0.0",
      };
      const result = splitUIMetaNested(combinedMeta);

      expect(result.toolMeta).toEqual({
        ui: {
          "ui/resourceUri": "ui://weather-server/dashboard",
        },
        version: "2.0.0",
      });

      expect(result.resourceMeta).toEqual({
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
