/* auto-generated - do not edit */
import { z } from "zod";
import { createSTDIOClient, type StdioClient, type ToolMetadata } from "xmcp";


const DEFAULT_STDIO_COMMAND = "npx";

const DEFAULT_NPM_PACKAGE = "@playwright/mcp";

const DEFAULT_NPM_ARGS: string[] = [];

const DEFAULT_STDIO_STDERR = "pipe" as const;

export const browserCloseSchema = z.object({});
export type BrowserCloseArgs = z.infer<typeof browserCloseSchema>;

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

export const browserResizeSchema = z.object({
  width: z.number().describe("Width of the browser window"),
  height: z.number().describe("Height of the browser window"),
});
export type BrowserResizeArgs = z.infer<typeof browserResizeSchema>;

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

export const browserConsoleMessagesSchema = z.object({
  onlyErrors: z.boolean().describe("Only return error messages").optional(),
});
export type BrowserConsoleMessagesArgs = z.infer<typeof browserConsoleMessagesSchema>;

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

export const browserHandleDialogSchema = z.object({
  accept: z.boolean().describe("Whether to accept the dialog."),
  promptText: z.string().describe("The text of the prompt in case of a prompt dialog.").optional(),
});
export type BrowserHandleDialogArgs = z.infer<typeof browserHandleDialogSchema>;

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

export const browserEvaluateSchema = z.object({
  function: z.string().describe("() => { /* code */ } or (element) => { /* code */ } when element is provided"),
  element: z.string().describe("Human-readable element description used to obtain permission to interact with the element").optional(),
  ref: z.string().describe("Exact target element reference from the page snapshot").optional(),
});
export type BrowserEvaluateArgs = z.infer<typeof browserEvaluateSchema>;

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

export const browserFileUploadSchema = z.object({
  paths: z.array(z.string()).describe("The absolute paths to the files to upload. Can be single file or multiple files. If omitted, file chooser is cancelled.").optional(),
});
export type BrowserFileUploadArgs = z.infer<typeof browserFileUploadSchema>;

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

export const browserFillFormSchema = z.object({
  fields: z.array(z.object({
  name: z.string().describe("Human-readable field name"),
  type: z.enum(["textbox", "checkbox", "radio", "combobox", "slider"]).describe("Type of the field"),
  ref: z.string().describe("Exact target field reference from the page snapshot"),
  value: z.string().describe("Value to fill in the field. If the field is a checkbox, the value should be `true` or `false`. If the field is a combobox, the value should be the text of the option."),
})).describe("Fields to fill in"),
});
export type BrowserFillFormArgs = z.infer<typeof browserFillFormSchema>;

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

export const browserInstallSchema = z.object({});
export type BrowserInstallArgs = z.infer<typeof browserInstallSchema>;

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

export const browserPressKeySchema = z.object({
  key: z.string().describe("Name of the key to press or a character to generate, such as `ArrowLeft` or `a`"),
});
export type BrowserPressKeyArgs = z.infer<typeof browserPressKeySchema>;

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

export const browserTypeSchema = z.object({
  element: z.string().describe("Human-readable element description used to obtain permission to interact with the element"),
  ref: z.string().describe("Exact target element reference from the page snapshot"),
  text: z.string().describe("Text to type into the element"),
  submit: z.boolean().describe("Whether to submit entered text (press Enter after)").optional(),
  slowly: z.boolean().describe("Whether to type one character at a time. Useful for triggering key handlers in the page. By default entire text is filled in at once.").optional(),
});
export type BrowserTypeArgs = z.infer<typeof browserTypeSchema>;

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

export const browserNavigateSchema = z.object({
  url: z.string().describe("The URL to navigate to"),
});
export type BrowserNavigateArgs = z.infer<typeof browserNavigateSchema>;

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

export const browserNavigateBackSchema = z.object({});
export type BrowserNavigateBackArgs = z.infer<typeof browserNavigateBackSchema>;

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

export const browserNetworkRequestsSchema = z.object({});
export type BrowserNetworkRequestsArgs = z.infer<typeof browserNetworkRequestsSchema>;

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

export const browserRunCodeSchema = z.object({
  code: z.string().describe("Playwright code snippet to run. The snippet should access the `page` object to interact with the page. Can make multiple statements. For example: `await page.getByRole('button', { name: 'Submit' }).click();`"),
});
export type BrowserRunCodeArgs = z.infer<typeof browserRunCodeSchema>;

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

export const browserTakeScreenshotSchema = z.object({
  type: z.enum(["png", "jpeg"]).describe("Image format for the screenshot. Default is png.").optional(),
  filename: z.string().describe("File name to save the screenshot to. Defaults to `page-{timestamp}.{png|jpeg}` if not specified. Prefer relative file names to stay within the output directory.").optional(),
  element: z.string().describe("Human-readable element description used to obtain permission to screenshot the element. If not provided, the screenshot will be taken of viewport. If element is provided, ref must be provided too.").optional(),
  ref: z.string().describe("Exact target element reference from the page snapshot. If not provided, the screenshot will be taken of viewport. If ref is provided, element must be provided too.").optional(),
  fullPage: z.boolean().describe("When true, takes a screenshot of the full scrollable page, instead of the currently visible viewport. Cannot be used with element screenshots.").optional(),
});
export type BrowserTakeScreenshotArgs = z.infer<typeof browserTakeScreenshotSchema>;

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

export const browserSnapshotSchema = z.object({});
export type BrowserSnapshotArgs = z.infer<typeof browserSnapshotSchema>;

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

export const browserClickSchema = z.object({
  element: z.string().describe("Human-readable element description used to obtain permission to interact with the element"),
  ref: z.string().describe("Exact target element reference from the page snapshot"),
  doubleClick: z.boolean().describe("Whether to perform a double click instead of a single click").optional(),
  button: z.enum(["left", "right", "middle"]).describe("Button to click, defaults to left").optional(),
  modifiers: z.array(z.enum(["Alt", "Control", "ControlOrMeta", "Meta", "Shift"])).describe("Modifier keys to press").optional(),
});
export type BrowserClickArgs = z.infer<typeof browserClickSchema>;

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

export const browserDragSchema = z.object({
  startElement: z.string().describe("Human-readable source element description used to obtain the permission to interact with the element"),
  startRef: z.string().describe("Exact source element reference from the page snapshot"),
  endElement: z.string().describe("Human-readable target element description used to obtain the permission to interact with the element"),
  endRef: z.string().describe("Exact target element reference from the page snapshot"),
});
export type BrowserDragArgs = z.infer<typeof browserDragSchema>;

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

export const browserHoverSchema = z.object({
  element: z.string().describe("Human-readable element description used to obtain permission to interact with the element"),
  ref: z.string().describe("Exact target element reference from the page snapshot"),
});
export type BrowserHoverArgs = z.infer<typeof browserHoverSchema>;

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

export const browserSelectOptionSchema = z.object({
  element: z.string().describe("Human-readable element description used to obtain permission to interact with the element"),
  ref: z.string().describe("Exact target element reference from the page snapshot"),
  values: z.array(z.string()).describe("Array of values to select in the dropdown. This can be a single value or multiple values."),
});
export type BrowserSelectOptionArgs = z.infer<typeof browserSelectOptionSchema>;

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

export const browserTabsSchema = z.object({
  action: z.enum(["list", "new", "close", "select"]).describe("Operation to perform"),
  index: z.number().describe("Tab index, used for close/select. If omitted for close, current tab is closed.").optional(),
});
export type BrowserTabsArgs = z.infer<typeof browserTabsSchema>;

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

export const browserWaitForSchema = z.object({
  time: z.number().describe("The time to wait in seconds").optional(),
  text: z.string().describe("The text to wait for").optional(),
  textGone: z.string().describe("The text to wait for to disappear").optional(),
});
export type BrowserWaitForArgs = z.infer<typeof browserWaitForSchema>;

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
