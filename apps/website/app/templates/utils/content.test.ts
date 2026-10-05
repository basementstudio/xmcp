import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, mock, test } from "node:test";
import { fileURLToPath } from "node:url";
import { getTemplateBySlug, getTemplateReadme, getTemplates } from "./content";

const initialCwd = process.cwd();
const websiteDirectory = fileURLToPath(new URL("../../../", import.meta.url));
const temporaryDirectories: string[] = [];

function fixture(
  frontmatter: string,
  body = "# Template\n\nSetup instructions."
) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-templates-"));
  temporaryDirectories.push(directory);
  fs.mkdirSync(path.join(directory, "content/templates"), { recursive: true });
  fs.writeFileSync(
    path.join(directory, "content/templates/example.md"),
    `---\n${frontmatter}\n---\n\n${body}`
  );
  process.chdir(directory);
  return directory;
}

afterEach(() => {
  process.chdir(initialCwd);
  mock.restoreAll();
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("the migrated catalog and every README load with all network access blocked", () => {
  process.chdir(websiteDirectory);
  const fetch = mock.method(globalThis, "fetch", () => {
    throw new Error("Network access is unavailable");
  });
  const templates = getTemplates();
  assert(templates.length >= 13);
  assert.equal(
    new Set(templates.map((item) => item.slug)).size,
    templates.length
  );
  for (const template of templates) {
    assert(getTemplateReadme(template).trim().length > 0);
    assert.equal(
      "content" in template,
      false,
      "README must not be sent in listing props"
    );
    assert.equal(
      template.repositoryUrl,
      `https://github.com/xmcp-dev/templates/tree/main/${template.slug}`
    );
  }
  const express = getTemplateBySlug("express");
  assert(express);
  assert.equal(express.name, "Express Starter");
  assert.equal(express.primaryFilterTag, "framework");
  assert(express.tags.includes("express"));
  assert.match(getTemplateReadme(express), /```/);
  assert.equal(getTemplateBySlug("missing"), null);
  assert.equal(getTemplateBySlug("../../README"), null);
  assert.equal(fetch.mock.callCount(), 0);
});

test("supports source overrides and local preview images", () => {
  const directory = fixture(`name: Example
description: An example template
category: framework
tags: [http, http]
sourceRepo: example/templates
sourceBranch: stable
path: starters/example
previewUrl: /templates/example.svg
deployUrl: https://example.com/deploy`);
  fs.mkdirSync(path.join(directory, "public/templates"), { recursive: true });
  fs.writeFileSync(
    path.join(directory, "public/templates/example.svg"),
    "<svg/>"
  );
  const [template] = getTemplates();
  assert.equal(
    template.repositoryUrl,
    "https://github.com/example/templates/tree/stable/starters/example"
  );
  assert.equal(template.previewUrl, "/templates/example.svg");
  assert.deepEqual(template.tags, ["http"]);
  assert.deepEqual(template.metadataKeywords, ["framework", "http"]);
});

for (const metadata of [
  "description: Missing name",
  "name: Missing description",
  "name: Invalid tags\ndescription: Example\ntags: not-an-array",
  "name: Invalid URL\ndescription: Example\ndeployUrl: javascript:alert(1)",
]) {
  test(`rejects malformed metadata: ${metadata.split("\n")[0]}`, () => {
    fixture(metadata);
    assert.throws(getTemplates, /Invalid template content in .*example\.md/);
  });
}

test("rejects an empty README rather than publishing an incomplete page", () => {
  fixture("name: Example\ndescription: Example", "");
  assert.throws(getTemplates, /README must not be empty/);
});

for (const previewUrl of [
  "/missing.webp",
  "https://example.com/image.png",
  "/../outside.png",
]) {
  test(`rejects a missing or nonlocal preview: ${previewUrl}`, () => {
    fixture(`name: Example\ndescription: Example\npreviewUrl: ${previewUrl}`);
    assert.throws(
      getTemplates,
      /previewUrl must reference an existing image in public/
    );
  });
}

test("rejects an empty catalog instead of showing a misleading search result", () => {
  const directory = fixture("name: Example\ndescription: Example");
  fs.unlinkSync(path.join(directory, "content/templates/example.md"));
  assert.throws(getTemplates, /No template content/);
});
