import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const code = readFileSync(
  new URL("../plugin/code.js", import.meta.url),
  "utf8"
);

type Node = {
  id: string;
  type: string;
  name: string;
  parent?: Node;
  children: Node[];
  characters: string;
  fontName: { family: string; style: string };
  width: number;
  height: number;
  [key: string]: unknown;
};

function fixture() {
  const nodes = new Map<string, Node>();
  let nextId = 1;
  const create = (type: string): Node => {
    const node: Node = {
      id: `2:${nextId++}`,
      type,
      name: type,
      children: [],
      characters: "",
      fontName: { family: "Inter", style: "Regular" },
      width: 100,
      height: 100,
      appendChild(child: Node) {
        child.parent = node;
        node.children.push(child);
      },
      resize(width: number, height: number) {
        node.width = width;
        node.height = height;
      },
      remove() {
        nodes.delete(node.id);
      },
      getRangeAllFontNames() {
        return [node.fontName];
      },
      async exportAsync({ format }: { format: string }) {
        return format === "SVG_STRING" ? "<svg/>" : new Uint8Array([1, 2, 3]);
      },
    };
    nodes.set(node.id, node);
    return node;
  };
  const page = create("PAGE");
  const responses: {
    id: string;
    result: {
      isError?: boolean;
      content: { type: string; text?: string; data?: string }[];
    };
  }[] = [];
  const fonts: unknown[] = [];
  const figma = {
    currentPage: { ...page, selection: [] as Node[] },
    root: { name: "Demo" },
    ui: {
      onmessage: async (_value: unknown) => {},
      postMessage: (message: (typeof responses)[number]) =>
        responses.push(message),
    },
    showUI() {},
    on() {},
    commitUndo() {},
    async getNodeByIdAsync(id: string) {
      return nodes.get(id);
    },
    async loadFontAsync(font: unknown) {
      fonts.push(font);
    },
    createFrame: () => create("FRAME"),
    createRectangle: () => create("RECTANGLE"),
    createText: () => create("TEXT"),
    base64Encode: (bytes: Uint8Array) => Buffer.from(bytes).toString("base64"),
  };
  runInNewContext(code, { figma, __html__: "", Uint8Array });
  return {
    nodes,
    figma,
    fonts,
    async call(
      operation: string,
      args: Record<string, unknown>,
      pageId = page.id
    ) {
      await figma.ui.onmessage({
        type: "command",
        command: { id: "command", pageId, operation, arguments: args },
      });
      // Normalize VM values before comparing them across realms.
      return JSON.parse(JSON.stringify(responses.at(-1)?.result));
    },
  };
}
const args = {
  kind: "frame",
  name: "Card",
  x: 10,
  y: 20,
  width: 320,
  height: 180,
  fill: "#FF0000",
  text: "Hello",
};

test("creates editable nodes, updates them, reads selection, and exports images and SVG", async () => {
  const { call, figma, nodes, fonts } = fixture();
  const created = JSON.parse((await call("create", args)).content[0].text);
  assert.equal(created.type, "FRAME");
  const node = nodes.get(created.id)!;
  assert.equal(node.parent?.id, figma.currentPage.id);
  await call("update", {
    nodeId: node.id,
    patch: { name: "Updated", width: 480 },
  });
  assert.equal(node.name, "Updated");
  assert.equal(node.width, 480);
  const text = JSON.parse(
    (await call("create", { ...args, kind: "text", parentId: node.id }))
      .content[0].text
  );
  await call("update", { nodeId: text.id, patch: { text: "Revised" } });
  assert.equal(nodes.get(text.id)?.characters, "Revised");
  assert.equal(fonts.length, 2);
  figma.currentPage.selection = [node];
  assert.equal(
    JSON.parse((await call("read", {})).content[0].text).selection[0].id,
    node.id
  );
  assert.deepEqual(
    (await call("export", { nodeId: node.id, format: "PNG" })).content[0],
    { type: "image", data: "AQID", mimeType: "image/png" }
  );
  assert.equal(
    (await call("export", { nodeId: node.id, format: "SVG" })).content[0].text,
    "<svg/>"
  );
});

test("rejects stale pages, off-page nodes, unsupported operations, and text edits on shapes", async () => {
  const { call, nodes } = fixture();
  const before = nodes.size;
  assert.equal((await call("create", args, "different-page")).isError, true);
  assert.equal(nodes.size, before);
  assert.equal((await call("eval", { code: "doSomething()" })).isError, true);
  const created = JSON.parse((await call("create", args)).content[0].text);
  assert.equal(
    (
      await call("update", {
        nodeId: created.id,
        patch: { text: "invalid", name: "must not change" },
      })
    ).isError,
    true
  );
  assert.equal(nodes.get(created.id)?.name, "Card");
  nodes.get(created.id)!.parent = undefined;
  assert.equal(
    (await call("update", { nodeId: created.id, patch: { name: "off page" } }))
      .isError,
    true
  );
});

test("a page switch during font loading prevents creation", async () => {
  const { call, nodes, figma } = fixture();
  figma.loadFontAsync = async () => {
    figma.currentPage.id = "other";
  };
  const before = nodes.size;
  assert.equal((await call("create", { ...args, kind: "text" })).isError, true);
  assert.equal(nodes.size, before);
});
