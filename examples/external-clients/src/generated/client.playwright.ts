/* auto-generated - do not edit */
import { z } from "zod";
import { createSTDIOClient, type StdioClient, type ToolMetadata } from "xmcp";


const DEFAULT_STDIO_COMMAND = "npx";

const DEFAULT_NPM_PACKAGE = "@playwright/mcp";

const DEFAULT_NPM_ARGS = [];

const DEFAULT_STDIO_STDERR = "pipe" as const;

function jsonSchemaToZodShape(schema: any): Record<string, z.ZodTypeAny> {
  if (!schema || typeof schema !== "object" || schema.type !== "object") {
    return {};
  }

  const properties = schema.properties ?? {};
  const required = new Set(
    Array.isArray(schema.required) ? (schema.required as string[]) : []
  );

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, propertySchema] of Object.entries(properties)) {
    shape[key] = jsonSchemaToZod(propertySchema, required.has(key));
  }

  return shape;
}

function jsonSchemaToZod(
  schema: any,
  isRequired: boolean
): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.any();
  }

  let zodType: z.ZodTypeAny;

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    const enumValues = schema.enum as [string, ...string[]];
    zodType = z.enum(enumValues);
  } else {
    switch (schema.type) {
      case "string":
        zodType = z.string();
        break;
      case "number":
      case "integer":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "array":
        zodType = z.array(jsonSchemaToZod(schema.items ?? {}, true));
        break;
      case "object":
        zodType = z.object(jsonSchemaToZodShape(schema));
        break;
      default:
        zodType = z.any();
    }
  }

  if (typeof schema.description === "string") {
    zodType = zodType.describe(schema.description);
  }

  if (!isRequired) {
    zodType = zodType.optional();
  }

  return zodType;
}

function jsonSchemaToZodObject(
  schema: any
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  return z.object(jsonSchemaToZodShape(schema));
}


const browserCloseShapeJson = {
  "type": "object",
  "properties": {},
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserCloseShape = jsonSchemaToZodShape(browserCloseShapeJson);
const browserCloseSchemaObject = z.object(browserCloseShape);
export const browserCloseSchema = jsonSchemaToZodObject(browserCloseShapeJson);
export type BrowserCloseArgs = z.infer<typeof browserCloseSchemaObject>;

export const browserCloseMetadata: ToolMetadata = {
  "name": "browser_close",
  "description": "Close the page",
  "annotations": {
    "title": "Close browser",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserClose(client: StdioClient) {
  return client.callTool({
    name: "browser_close",
    arguments: {},
  });
}

const browserResizeShapeJson = {
  "type": "object",
  "properties": {
    "width": {
      "type": "number",
      "description": "Width of the browser window"
    },
    "height": {
      "type": "number",
      "description": "Height of the browser window"
    }
  },
  "required": [
    "width",
    "height"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserResizeShape = jsonSchemaToZodShape(browserResizeShapeJson);
const browserResizeSchemaObject = z.object(browserResizeShape);
export const browserResizeSchema = jsonSchemaToZodObject(browserResizeShapeJson);
export type BrowserResizeArgs = z.infer<typeof browserResizeSchemaObject>;

export const browserResizeMetadata: ToolMetadata = {
  "name": "browser_resize",
  "description": "Resize the browser window",
  "annotations": {
    "title": "Resize browser window",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserResize(client: StdioClient, args: BrowserResizeArgs) {
  return client.callTool({
    name: "browser_resize",
    arguments: args,
  });
}

const browserConsoleMessagesShapeJson = {
  "type": "object",
  "properties": {
    "onlyErrors": {
      "type": "boolean",
      "description": "Only return error messages"
    }
  },
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserConsoleMessagesShape = jsonSchemaToZodShape(browserConsoleMessagesShapeJson);
const browserConsoleMessagesSchemaObject = z.object(browserConsoleMessagesShape);
export const browserConsoleMessagesSchema = jsonSchemaToZodObject(browserConsoleMessagesShapeJson);
export type BrowserConsoleMessagesArgs = z.infer<typeof browserConsoleMessagesSchemaObject>;

export const browserConsoleMessagesMetadata: ToolMetadata = {
  "name": "browser_console_messages",
  "description": "Returns all console messages",
  "annotations": {
    "title": "Get console messages",
    "readOnlyHint": true,
    "destructiveHint": false,
    "openWorldHint": true
  }
};

async function browserConsoleMessages(client: StdioClient) {
  return client.callTool({
    name: "browser_console_messages",
    arguments: {},
  });
}

const browserHandleDialogShapeJson = {
  "type": "object",
  "properties": {
    "accept": {
      "type": "boolean",
      "description": "Whether to accept the dialog."
    },
    "promptText": {
      "type": "string",
      "description": "The text of the prompt in case of a prompt dialog."
    }
  },
  "required": [
    "accept"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserHandleDialogShape = jsonSchemaToZodShape(browserHandleDialogShapeJson);
const browserHandleDialogSchemaObject = z.object(browserHandleDialogShape);
export const browserHandleDialogSchema = jsonSchemaToZodObject(browserHandleDialogShapeJson);
export type BrowserHandleDialogArgs = z.infer<typeof browserHandleDialogSchemaObject>;

export const browserHandleDialogMetadata: ToolMetadata = {
  "name": "browser_handle_dialog",
  "description": "Handle a dialog",
  "annotations": {
    "title": "Handle a dialog",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserHandleDialog(client: StdioClient, args: BrowserHandleDialogArgs) {
  return client.callTool({
    name: "browser_handle_dialog",
    arguments: args,
  });
}

const browserEvaluateShapeJson = {
  "type": "object",
  "properties": {
    "function": {
      "type": "string",
      "description": "() => { /* code */ } or (element) => { /* code */ } when element is provided"
    },
    "element": {
      "type": "string",
      "description": "Human-readable element description used to obtain permission to interact with the element"
    },
    "ref": {
      "type": "string",
      "description": "Exact target element reference from the page snapshot"
    }
  },
  "required": [
    "function"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserEvaluateShape = jsonSchemaToZodShape(browserEvaluateShapeJson);
const browserEvaluateSchemaObject = z.object(browserEvaluateShape);
export const browserEvaluateSchema = jsonSchemaToZodObject(browserEvaluateShapeJson);
export type BrowserEvaluateArgs = z.infer<typeof browserEvaluateSchemaObject>;

export const browserEvaluateMetadata: ToolMetadata = {
  "name": "browser_evaluate",
  "description": "Evaluate JavaScript expression on page or element",
  "annotations": {
    "title": "Evaluate JavaScript",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserEvaluate(client: StdioClient, args: BrowserEvaluateArgs) {
  return client.callTool({
    name: "browser_evaluate",
    arguments: args,
  });
}

const browserFileUploadShapeJson = {
  "type": "object",
  "properties": {
    "paths": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "The absolute paths to the files to upload. Can be single file or multiple files. If omitted, file chooser is cancelled."
    }
  },
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserFileUploadShape = jsonSchemaToZodShape(browserFileUploadShapeJson);
const browserFileUploadSchemaObject = z.object(browserFileUploadShape);
export const browserFileUploadSchema = jsonSchemaToZodObject(browserFileUploadShapeJson);
export type BrowserFileUploadArgs = z.infer<typeof browserFileUploadSchemaObject>;

export const browserFileUploadMetadata: ToolMetadata = {
  "name": "browser_file_upload",
  "description": "Upload one or multiple files",
  "annotations": {
    "title": "Upload files",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserFileUpload(client: StdioClient) {
  return client.callTool({
    name: "browser_file_upload",
    arguments: {},
  });
}

const browserFillFormShapeJson = {
  "type": "object",
  "properties": {
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Human-readable field name"
          },
          "type": {
            "type": "string",
            "enum": [
              "textbox",
              "checkbox",
              "radio",
              "combobox",
              "slider"
            ],
            "description": "Type of the field"
          },
          "ref": {
            "type": "string",
            "description": "Exact target field reference from the page snapshot"
          },
          "value": {
            "type": "string",
            "description": "Value to fill in the field. If the field is a checkbox, the value should be `true` or `false`. If the field is a combobox, the value should be the text of the option."
          }
        },
        "required": [
          "name",
          "type",
          "ref",
          "value"
        ],
        "additionalProperties": false
      },
      "description": "Fields to fill in"
    }
  },
  "required": [
    "fields"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserFillFormShape = jsonSchemaToZodShape(browserFillFormShapeJson);
const browserFillFormSchemaObject = z.object(browserFillFormShape);
export const browserFillFormSchema = jsonSchemaToZodObject(browserFillFormShapeJson);
export type BrowserFillFormArgs = z.infer<typeof browserFillFormSchemaObject>;

export const browserFillFormMetadata: ToolMetadata = {
  "name": "browser_fill_form",
  "description": "Fill multiple form fields",
  "annotations": {
    "title": "Fill form",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserFillForm(client: StdioClient, args: BrowserFillFormArgs) {
  return client.callTool({
    name: "browser_fill_form",
    arguments: args,
  });
}

const browserInstallShapeJson = {
  "type": "object",
  "properties": {},
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserInstallShape = jsonSchemaToZodShape(browserInstallShapeJson);
const browserInstallSchemaObject = z.object(browserInstallShape);
export const browserInstallSchema = jsonSchemaToZodObject(browserInstallShapeJson);
export type BrowserInstallArgs = z.infer<typeof browserInstallSchemaObject>;

export const browserInstallMetadata: ToolMetadata = {
  "name": "browser_install",
  "description": "Install the browser specified in the config. Call this if you get an error about the browser not being installed.",
  "annotations": {
    "title": "Install the browser specified in the config",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserInstall(client: StdioClient) {
  return client.callTool({
    name: "browser_install",
    arguments: {},
  });
}

const browserPressKeyShapeJson = {
  "type": "object",
  "properties": {
    "key": {
      "type": "string",
      "description": "Name of the key to press or a character to generate, such as `ArrowLeft` or `a`"
    }
  },
  "required": [
    "key"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserPressKeyShape = jsonSchemaToZodShape(browserPressKeyShapeJson);
const browserPressKeySchemaObject = z.object(browserPressKeyShape);
export const browserPressKeySchema = jsonSchemaToZodObject(browserPressKeyShapeJson);
export type BrowserPressKeyArgs = z.infer<typeof browserPressKeySchemaObject>;

export const browserPressKeyMetadata: ToolMetadata = {
  "name": "browser_press_key",
  "description": "Press a key on the keyboard",
  "annotations": {
    "title": "Press a key",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserPressKey(client: StdioClient, args: BrowserPressKeyArgs) {
  return client.callTool({
    name: "browser_press_key",
    arguments: args,
  });
}

const browserTypeShapeJson = {
  "type": "object",
  "properties": {
    "element": {
      "type": "string",
      "description": "Human-readable element description used to obtain permission to interact with the element"
    },
    "ref": {
      "type": "string",
      "description": "Exact target element reference from the page snapshot"
    },
    "text": {
      "type": "string",
      "description": "Text to type into the element"
    },
    "submit": {
      "type": "boolean",
      "description": "Whether to submit entered text (press Enter after)"
    },
    "slowly": {
      "type": "boolean",
      "description": "Whether to type one character at a time. Useful for triggering key handlers in the page. By default entire text is filled in at once."
    }
  },
  "required": [
    "element",
    "ref",
    "text"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserTypeShape = jsonSchemaToZodShape(browserTypeShapeJson);
const browserTypeSchemaObject = z.object(browserTypeShape);
export const browserTypeSchema = jsonSchemaToZodObject(browserTypeShapeJson);
export type BrowserTypeArgs = z.infer<typeof browserTypeSchemaObject>;

export const browserTypeMetadata: ToolMetadata = {
  "name": "browser_type",
  "description": "Type text into editable element",
  "annotations": {
    "title": "Type text",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserType(client: StdioClient, args: BrowserTypeArgs) {
  return client.callTool({
    name: "browser_type",
    arguments: args,
  });
}

const browserNavigateShapeJson = {
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "The URL to navigate to"
    }
  },
  "required": [
    "url"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserNavigateShape = jsonSchemaToZodShape(browserNavigateShapeJson);
const browserNavigateSchemaObject = z.object(browserNavigateShape);
export const browserNavigateSchema = jsonSchemaToZodObject(browserNavigateShapeJson);
export type BrowserNavigateArgs = z.infer<typeof browserNavigateSchemaObject>;

export const browserNavigateMetadata: ToolMetadata = {
  "name": "browser_navigate",
  "description": "Navigate to a URL",
  "annotations": {
    "title": "Navigate to a URL",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserNavigate(client: StdioClient, args: BrowserNavigateArgs) {
  return client.callTool({
    name: "browser_navigate",
    arguments: args,
  });
}

const browserNavigateBackShapeJson = {
  "type": "object",
  "properties": {},
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserNavigateBackShape = jsonSchemaToZodShape(browserNavigateBackShapeJson);
const browserNavigateBackSchemaObject = z.object(browserNavigateBackShape);
export const browserNavigateBackSchema = jsonSchemaToZodObject(browserNavigateBackShapeJson);
export type BrowserNavigateBackArgs = z.infer<typeof browserNavigateBackSchemaObject>;

export const browserNavigateBackMetadata: ToolMetadata = {
  "name": "browser_navigate_back",
  "description": "Go back to the previous page",
  "annotations": {
    "title": "Go back",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserNavigateBack(client: StdioClient) {
  return client.callTool({
    name: "browser_navigate_back",
    arguments: {},
  });
}

const browserNetworkRequestsShapeJson = {
  "type": "object",
  "properties": {},
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserNetworkRequestsShape = jsonSchemaToZodShape(browserNetworkRequestsShapeJson);
const browserNetworkRequestsSchemaObject = z.object(browserNetworkRequestsShape);
export const browserNetworkRequestsSchema = jsonSchemaToZodObject(browserNetworkRequestsShapeJson);
export type BrowserNetworkRequestsArgs = z.infer<typeof browserNetworkRequestsSchemaObject>;

export const browserNetworkRequestsMetadata: ToolMetadata = {
  "name": "browser_network_requests",
  "description": "Returns all network requests since loading the page",
  "annotations": {
    "title": "List network requests",
    "readOnlyHint": true,
    "destructiveHint": false,
    "openWorldHint": true
  }
};

async function browserNetworkRequests(client: StdioClient) {
  return client.callTool({
    name: "browser_network_requests",
    arguments: {},
  });
}

const browserRunCodeShapeJson = {
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "Playwright code snippet to run. The snippet should access the `page` object to interact with the page. Can make multiple statements. For example: `await page.getByRole('button', { name: 'Submit' }).click();`"
    }
  },
  "required": [
    "code"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserRunCodeShape = jsonSchemaToZodShape(browserRunCodeShapeJson);
const browserRunCodeSchemaObject = z.object(browserRunCodeShape);
export const browserRunCodeSchema = jsonSchemaToZodObject(browserRunCodeShapeJson);
export type BrowserRunCodeArgs = z.infer<typeof browserRunCodeSchemaObject>;

export const browserRunCodeMetadata: ToolMetadata = {
  "name": "browser_run_code",
  "description": "Run Playwright code snippet",
  "annotations": {
    "title": "Run Playwright code",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserRunCode(client: StdioClient, args: BrowserRunCodeArgs) {
  return client.callTool({
    name: "browser_run_code",
    arguments: args,
  });
}

const browserTakeScreenshotShapeJson = {
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": [
        "png",
        "jpeg"
      ],
      "default": "png",
      "description": "Image format for the screenshot. Default is png."
    },
    "filename": {
      "type": "string",
      "description": "File name to save the screenshot to. Defaults to `page-{timestamp}.{png|jpeg}` if not specified. Prefer relative file names to stay within the output directory."
    },
    "element": {
      "type": "string",
      "description": "Human-readable element description used to obtain permission to screenshot the element. If not provided, the screenshot will be taken of viewport. If element is provided, ref must be provided too."
    },
    "ref": {
      "type": "string",
      "description": "Exact target element reference from the page snapshot. If not provided, the screenshot will be taken of viewport. If ref is provided, element must be provided too."
    },
    "fullPage": {
      "type": "boolean",
      "description": "When true, takes a screenshot of the full scrollable page, instead of the currently visible viewport. Cannot be used with element screenshots."
    }
  },
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserTakeScreenshotShape = jsonSchemaToZodShape(browserTakeScreenshotShapeJson);
const browserTakeScreenshotSchemaObject = z.object(browserTakeScreenshotShape);
export const browserTakeScreenshotSchema = jsonSchemaToZodObject(browserTakeScreenshotShapeJson);
export type BrowserTakeScreenshotArgs = z.infer<typeof browserTakeScreenshotSchemaObject>;

export const browserTakeScreenshotMetadata: ToolMetadata = {
  "name": "browser_take_screenshot",
  "description": "Take a screenshot of the current page. You can't perform actions based on the screenshot, use browser_snapshot for actions.",
  "annotations": {
    "title": "Take a screenshot",
    "readOnlyHint": true,
    "destructiveHint": false,
    "openWorldHint": true
  }
};

async function browserTakeScreenshot(client: StdioClient) {
  return client.callTool({
    name: "browser_take_screenshot",
    arguments: {},
  });
}

const browserSnapshotShapeJson = {
  "type": "object",
  "properties": {},
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserSnapshotShape = jsonSchemaToZodShape(browserSnapshotShapeJson);
const browserSnapshotSchemaObject = z.object(browserSnapshotShape);
export const browserSnapshotSchema = jsonSchemaToZodObject(browserSnapshotShapeJson);
export type BrowserSnapshotArgs = z.infer<typeof browserSnapshotSchemaObject>;

export const browserSnapshotMetadata: ToolMetadata = {
  "name": "browser_snapshot",
  "description": "Capture accessibility snapshot of the current page, this is better than screenshot",
  "annotations": {
    "title": "Page snapshot",
    "readOnlyHint": true,
    "destructiveHint": false,
    "openWorldHint": true
  }
};

async function browserSnapshot(client: StdioClient) {
  return client.callTool({
    name: "browser_snapshot",
    arguments: {},
  });
}

const browserClickShapeJson = {
  "type": "object",
  "properties": {
    "element": {
      "type": "string",
      "description": "Human-readable element description used to obtain permission to interact with the element"
    },
    "ref": {
      "type": "string",
      "description": "Exact target element reference from the page snapshot"
    },
    "doubleClick": {
      "type": "boolean",
      "description": "Whether to perform a double click instead of a single click"
    },
    "button": {
      "type": "string",
      "enum": [
        "left",
        "right",
        "middle"
      ],
      "description": "Button to click, defaults to left"
    },
    "modifiers": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "Alt",
          "Control",
          "ControlOrMeta",
          "Meta",
          "Shift"
        ]
      },
      "description": "Modifier keys to press"
    }
  },
  "required": [
    "element",
    "ref"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserClickShape = jsonSchemaToZodShape(browserClickShapeJson);
const browserClickSchemaObject = z.object(browserClickShape);
export const browserClickSchema = jsonSchemaToZodObject(browserClickShapeJson);
export type BrowserClickArgs = z.infer<typeof browserClickSchemaObject>;

export const browserClickMetadata: ToolMetadata = {
  "name": "browser_click",
  "description": "Perform click on a web page",
  "annotations": {
    "title": "Click",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserClick(client: StdioClient, args: BrowserClickArgs) {
  return client.callTool({
    name: "browser_click",
    arguments: args,
  });
}

const browserDragShapeJson = {
  "type": "object",
  "properties": {
    "startElement": {
      "type": "string",
      "description": "Human-readable source element description used to obtain the permission to interact with the element"
    },
    "startRef": {
      "type": "string",
      "description": "Exact source element reference from the page snapshot"
    },
    "endElement": {
      "type": "string",
      "description": "Human-readable target element description used to obtain the permission to interact with the element"
    },
    "endRef": {
      "type": "string",
      "description": "Exact target element reference from the page snapshot"
    }
  },
  "required": [
    "startElement",
    "startRef",
    "endElement",
    "endRef"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserDragShape = jsonSchemaToZodShape(browserDragShapeJson);
const browserDragSchemaObject = z.object(browserDragShape);
export const browserDragSchema = jsonSchemaToZodObject(browserDragShapeJson);
export type BrowserDragArgs = z.infer<typeof browserDragSchemaObject>;

export const browserDragMetadata: ToolMetadata = {
  "name": "browser_drag",
  "description": "Perform drag and drop between two elements",
  "annotations": {
    "title": "Drag mouse",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserDrag(client: StdioClient, args: BrowserDragArgs) {
  return client.callTool({
    name: "browser_drag",
    arguments: args,
  });
}

const browserHoverShapeJson = {
  "type": "object",
  "properties": {
    "element": {
      "type": "string",
      "description": "Human-readable element description used to obtain permission to interact with the element"
    },
    "ref": {
      "type": "string",
      "description": "Exact target element reference from the page snapshot"
    }
  },
  "required": [
    "element",
    "ref"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserHoverShape = jsonSchemaToZodShape(browserHoverShapeJson);
const browserHoverSchemaObject = z.object(browserHoverShape);
export const browserHoverSchema = jsonSchemaToZodObject(browserHoverShapeJson);
export type BrowserHoverArgs = z.infer<typeof browserHoverSchemaObject>;

export const browserHoverMetadata: ToolMetadata = {
  "name": "browser_hover",
  "description": "Hover over element on page",
  "annotations": {
    "title": "Hover mouse",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserHover(client: StdioClient, args: BrowserHoverArgs) {
  return client.callTool({
    name: "browser_hover",
    arguments: args,
  });
}

const browserSelectOptionShapeJson = {
  "type": "object",
  "properties": {
    "element": {
      "type": "string",
      "description": "Human-readable element description used to obtain permission to interact with the element"
    },
    "ref": {
      "type": "string",
      "description": "Exact target element reference from the page snapshot"
    },
    "values": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Array of values to select in the dropdown. This can be a single value or multiple values."
    }
  },
  "required": [
    "element",
    "ref",
    "values"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserSelectOptionShape = jsonSchemaToZodShape(browserSelectOptionShapeJson);
const browserSelectOptionSchemaObject = z.object(browserSelectOptionShape);
export const browserSelectOptionSchema = jsonSchemaToZodObject(browserSelectOptionShapeJson);
export type BrowserSelectOptionArgs = z.infer<typeof browserSelectOptionSchemaObject>;

export const browserSelectOptionMetadata: ToolMetadata = {
  "name": "browser_select_option",
  "description": "Select an option in a dropdown",
  "annotations": {
    "title": "Select option",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserSelectOption(client: StdioClient, args: BrowserSelectOptionArgs) {
  return client.callTool({
    name: "browser_select_option",
    arguments: args,
  });
}

const browserTabsShapeJson = {
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "list",
        "new",
        "close",
        "select"
      ],
      "description": "Operation to perform"
    },
    "index": {
      "type": "number",
      "description": "Tab index, used for close/select. If omitted for close, current tab is closed."
    }
  },
  "required": [
    "action"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserTabsShape = jsonSchemaToZodShape(browserTabsShapeJson);
const browserTabsSchemaObject = z.object(browserTabsShape);
export const browserTabsSchema = jsonSchemaToZodObject(browserTabsShapeJson);
export type BrowserTabsArgs = z.infer<typeof browserTabsSchemaObject>;

export const browserTabsMetadata: ToolMetadata = {
  "name": "browser_tabs",
  "description": "List, create, close, or select a browser tab.",
  "annotations": {
    "title": "Manage tabs",
    "readOnlyHint": false,
    "destructiveHint": true,
    "openWorldHint": true
  }
};

async function browserTabs(client: StdioClient, args: BrowserTabsArgs) {
  return client.callTool({
    name: "browser_tabs",
    arguments: args,
  });
}

const browserWaitForShapeJson = {
  "type": "object",
  "properties": {
    "time": {
      "type": "number",
      "description": "The time to wait in seconds"
    },
    "text": {
      "type": "string",
      "description": "The text to wait for"
    },
    "textGone": {
      "type": "string",
      "description": "The text to wait for to disappear"
    }
  },
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
} as const;
export const browserWaitForShape = jsonSchemaToZodShape(browserWaitForShapeJson);
const browserWaitForSchemaObject = z.object(browserWaitForShape);
export const browserWaitForSchema = jsonSchemaToZodObject(browserWaitForShapeJson);
export type BrowserWaitForArgs = z.infer<typeof browserWaitForSchemaObject>;

export const browserWaitForMetadata: ToolMetadata = {
  "name": "browser_wait_for",
  "description": "Wait for text to appear or disappear or a specified time to pass",
  "annotations": {
    "title": "Wait for",
    "readOnlyHint": true,
    "destructiveHint": false,
    "openWorldHint": true
  }
};

async function browserWaitFor(client: StdioClient) {
  return client.callTool({
    name: "browser_wait_for",
    arguments: {},
  });
}


export interface RemoteToolClientOptions {
  command?: string;
  npm?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  stderr?: "pipe" | "inherit" | "ignore";
}

export async function createRemoteToolClient(
  options: RemoteToolClientOptions = {}
) {
  const command = options.command ?? DEFAULT_STDIO_COMMAND;
  const npmPackage = options.npm ?? DEFAULT_NPM_PACKAGE;
  const extraArgs = options.args ?? DEFAULT_NPM_ARGS;
  const env = options.env;
  const cwd = options.cwd;
  const stderr = options.stderr ?? DEFAULT_STDIO_STDERR;

  const connection = await createSTDIOClient({
    command,
    args: [npmPackage, ...extraArgs],
    env,
    cwd,
    stderr,
  });
  const client = connection.client;

  return {
    browserClose: async () => browserClose(client),
    browserResize: async (args: BrowserResizeArgs) => browserResize(client, args),
    browserConsoleMessages: async () => browserConsoleMessages(client),
    browserHandleDialog: async (args: BrowserHandleDialogArgs) => browserHandleDialog(client, args),
    browserEvaluate: async (args: BrowserEvaluateArgs) => browserEvaluate(client, args),
    browserFileUpload: async () => browserFileUpload(client),
    browserFillForm: async (args: BrowserFillFormArgs) => browserFillForm(client, args),
    browserInstall: async () => browserInstall(client),
    browserPressKey: async (args: BrowserPressKeyArgs) => browserPressKey(client, args),
    browserType: async (args: BrowserTypeArgs) => browserType(client, args),
    browserNavigate: async (args: BrowserNavigateArgs) => browserNavigate(client, args),
    browserNavigateBack: async () => browserNavigateBack(client),
    browserNetworkRequests: async () => browserNetworkRequests(client),
    browserRunCode: async (args: BrowserRunCodeArgs) => browserRunCode(client, args),
    browserTakeScreenshot: async () => browserTakeScreenshot(client),
    browserSnapshot: async () => browserSnapshot(client),
    browserClick: async (args: BrowserClickArgs) => browserClick(client, args),
    browserDrag: async (args: BrowserDragArgs) => browserDrag(client, args),
    browserHover: async (args: BrowserHoverArgs) => browserHover(client, args),
    browserSelectOption: async (args: BrowserSelectOptionArgs) => browserSelectOption(client, args),
    browserTabs: async (args: BrowserTabsArgs) => browserTabs(client, args),
    browserWaitFor: async () => browserWaitFor(client),
    rawClient: client,
    connection,
  } as const;
}

export type RemoteToolClient = Awaited<
  ReturnType<typeof createRemoteToolClient>
>;

export const clientPlaywright = createRemoteToolClient();
