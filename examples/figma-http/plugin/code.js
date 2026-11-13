/* global figma, __html__ */
figma.showUI(__html__, { width: 360, height: 300, themeColors: true });

function info() {
  return {
    documentName: figma.root.name,
    pageId: figma.currentPage.id,
    pageName: figma.currentPage.name,
  };
}
function summary(node) {
  return {
    id: node.id,
    type: node.type,
    name: node.name,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    ...(node.type === "TEXT" ? { text: node.characters } : {}),
  };
}
function textResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}
function checkPage(pageId) {
  if (figma.currentPage.id !== pageId)
    throw new Error(
      "The Figma page changed. Reconnect the plugin before continuing."
    );
}
function color(hex) {
  return {
    type: "SOLID",
    color: {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255,
    },
  };
}
async function pageNode(id, pageId) {
  const node = await figma.getNodeByIdAsync(id);
  checkPage(pageId);
  if (!node || node.type === "PAGE" || node.type === "DOCUMENT")
    throw new Error("A canvas node is required.");
  let parent = node.parent;
  while (parent && parent.id !== pageId) parent = parent.parent;
  if (!parent) throw new Error("The node is not on the connected page.");
  return node;
}

async function execute({ operation, pageId, arguments: args }) {
  checkPage(pageId);
  if (operation === "read") {
    return textResult({
      ...info(),
      selection: figma.currentPage.selection.slice(0, 100).map(summary),
      nodes: figma.currentPage.children.slice(0, 100).map(summary),
      totalNodes: figma.currentPage.children.length,
    });
  }
  if (operation === "create") {
    if (!["frame", "rectangle", "text"].includes(args.kind))
      throw new Error("Unsupported node kind.");
    const parent = args.parentId
      ? await pageNode(args.parentId, pageId)
      : figma.currentPage;
    if (parent.type !== "PAGE" && parent.type !== "FRAME")
      throw new Error("The parent must be a frame on the connected page.");
    if (args.kind === "text")
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    checkPage(pageId);
    const node =
      args.kind === "frame"
        ? figma.createFrame()
        : args.kind === "rectangle"
          ? figma.createRectangle()
          : figma.createText();
    try {
      parent.appendChild(node);
      node.name = args.name;
      node.x = args.x;
      node.y = args.y;
      node.fills = [color(args.fill)];
      if (node.type === "TEXT") {
        node.fontName = { family: "Inter", style: "Regular" };
        node.characters = args.text;
        node.textAutoResize = "NONE";
      }
      node.resize(args.width, args.height);
      figma.commitUndo();
      return textResult(summary(node));
    } catch (error) {
      node.remove();
      throw error;
    }
  }
  if (operation === "update") {
    const node = await pageNode(args.nodeId, pageId);
    if (!["FRAME", "RECTANGLE", "TEXT"].includes(node.type))
      throw new Error(
        "Only frames, rectangles, and text nodes can be updated by this example."
      );
    const patch = args.patch;
    if (patch.text !== undefined) {
      if (node.type !== "TEXT")
        throw new Error("The text property requires a text node.");
      const fonts = node.characters.length
        ? node.getRangeAllFontNames(0, node.characters.length)
        : [node.fontName];
      await Promise.all(fonts.map((font) => figma.loadFontAsync(font)));
      checkPage(pageId);
    }
    if (patch.name !== undefined) node.name = patch.name;
    if (patch.x !== undefined) node.x = patch.x;
    if (patch.y !== undefined) node.y = patch.y;
    if (patch.fill !== undefined) node.fills = [color(patch.fill)];
    if (patch.text !== undefined) node.characters = patch.text;
    if (patch.width !== undefined || patch.height !== undefined)
      node.resize(patch.width ?? node.width, patch.height ?? node.height);
    figma.commitUndo();
    return textResult(summary(node));
  }
  if (operation === "export") {
    const node = await pageNode(args.nodeId, pageId);
    if (args.format === "SVG") {
      const svg = await node.exportAsync({ format: "SVG_STRING" });
      return { content: [{ type: "text", text: svg }] };
    }
    if (args.format !== "PNG") throw new Error("Unsupported export format.");
    const bytes = await node.exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 1 },
    });
    // Stay below the HTTP transport's default 10 MB JSON limit after base64 encoding.
    const MAX_EXPORT_BYTES = 5 * 1024 * 1024;
    if (bytes.length > MAX_EXPORT_BYTES)
      throw new Error("Export is too large. Choose a smaller node.");
    return {
      content: [
        {
          type: "image",
          data: figma.base64Encode(bytes),
          mimeType: "image/png",
        },
      ],
    };
  }
  throw new Error("Unsupported operation.");
}

figma.ui.onmessage = async (message) => {
  if (message.type === "context") {
    figma.ui.postMessage({ type: "context", info: info() });
    return;
  }
  if (message.type !== "command") return;
  try {
    figma.ui.postMessage({
      type: "result",
      id: message.command.id,
      result: await execute(message.command),
    });
  } catch (error) {
    figma.ui.postMessage({
      type: "result",
      id: message.command.id,
      result: {
        isError: true,
        content: [
          {
            type: "text",
            text:
              error instanceof Error ? error.message : "Figma operation failed",
          },
        ],
      },
    });
  }
};
figma.on("currentpagechange", () =>
  figma.ui.postMessage({ type: "page-changed" })
);
