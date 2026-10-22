import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSidebarTree,
  getActiveSidebarSections,
} from "../lib/docs-sidebar.ts";

const page = (url) => ({ type: "page", name: url, url });
const section = (name = "Shared heading") => ({ type: "separator", name });
const folder = (children, index) => ({
  type: "folder",
  name: "Folder",
  children,
  index,
});

test("groups sections after ungrouped pages without losing items", () => {
  const tree = buildSidebarTree([
    page("/docs"),
    section(),
    page("/a"),
    section(),
    page("/b"),
  ]);
  assert.equal(tree.length, 3);
  assert.equal(tree[0].item.url, "/docs");
  assert.equal(tree[1].children[0].item.url, "/a");
  assert.equal(tree[2].children[0].item.url, "/b");
  assert.notEqual(tree[1].id, tree[2].id);
  assert.deepEqual(getActiveSidebarSections(tree, "/b"), [tree[2].id]);
});

test("reveals every ancestor of nested pages and folder indexes", () => {
  const tree = buildSidebarTree([
    section(),
    folder([section(), folder([page("/deep")], page("/index"))]),
  ]);
  const outer = tree[0];
  const firstFolder = outer.children[0];
  const nestedSection = firstFolder.children[0];
  const nestedFolder = nestedSection.children[0];
  const ancestors = [
    outer.id,
    firstFolder.id,
    nestedSection.id,
    nestedFolder.id,
  ];
  assert.deepEqual(getActiveSidebarSections(tree, "/deep"), ancestors);
  assert.deepEqual(getActiveSidebarSections(tree, "/index"), ancestors);
  assert.deepEqual(getActiveSidebarSections(tree, "/missing"), []);
});

test("IDs are scoped to parents even when child IDs and labels repeat", () => {
  const children = [{ ...section(), $id: "section/id" }, page("/child")];
  const tree = buildSidebarTree([folder(children), folder(children)]);
  assert.notEqual(tree[0].children[0].id, tree[1].children[0].id);
  assert.deepEqual(
    buildSidebarTree([folder(children), folder(children)]),
    tree
  );
});

test("handles empty trees, empty sections, and standalone pages", () => {
  assert.deepEqual(buildSidebarTree([]), []);
  const tree = buildSidebarTree([page("/docs"), section(), section()]);
  assert.equal(tree.length, 3);
  assert.deepEqual(tree[1].children, []);
  assert.deepEqual(tree[2].children, []);
  assert.deepEqual(getActiveSidebarSections(tree, "/docs"), []);
});
