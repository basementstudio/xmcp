import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, mock, test } from "node:test";
import { fileURLToPath } from "node:url";
import { getTemplateBySlug, getTemplateReadme, getTemplates } from "./content";
import { buildDeployOptions } from "./deploy";
import { resolveTemplatePreviewImage } from "../../../lib/template-preview-image";

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
      `https://github.com/${template.sourceRepo}/tree/${template.sourceBranch}/${template.path}`
    );
  }
  const express = getTemplateBySlug("express");
  assert(express);
  assert.equal(express.name, "Express Starter");
  assert.equal(
    express.repositoryUrl,
    "https://github.com/xmcp-dev/templates/tree/main/express"
  );
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

test("integration starters resolve to runnable workspace sources and their own logos", () => {
  process.chdir(websiteDirectory);
  for (const provider of [
    "browserbase",
    "firecrawl",
    "github",
    "linear",
    "resend",
    "paper",
  ]) {
    const template = getTemplateBySlug(provider);
    assert(template, `Missing template: ${provider}`);
    const transport = provider === "paper" ? "stdio" : "http";
    assert.equal(
      template.repositoryUrl,
      `https://github.com/basementstudio/xmcp/tree/main/examples/${provider}-${transport}`
    );
    const source = path.resolve(websiteDirectory, "../..", template.path);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(source, "package.json"), "utf8")
    );
    assert.equal(manifest.name, `${provider}-${transport}`);
    assert(manifest.scripts.build && manifest.scripts.start);
    const readme = getTemplateReadme(template);
    assert(readme.includes(`pnpm --filter ${manifest.name} build`));
    assert(
      !readme.includes("create-xmcp-app --example"),
      "Workspace sources are not in the CLI's standalone templates repository"
    );
    const image = resolveTemplatePreviewImage(template);
    assert.equal(image.src, `/templates/${provider}.svg`);
    assert(fs.existsSync(path.join(websiteDirectory, "public", image.src)));
  }
});

test("deployment actions respect local-only and workspace starters without changing cloneable templates", () => {
  process.chdir(websiteDirectory);
  const paper = getTemplateBySlug("paper");
  assert(paper);
  assert.deepEqual(buildDeployOptions(paper), []);
  for (const provider of [
    "browserbase",
    "firecrawl",
    "github",
    "linear",
    "resend",
  ]) {
    const template = getTemplateBySlug(provider);
    assert(template);
    const options = buildDeployOptions(template);
    assert(options.length > 0);
    assert(
      options.every(
        (option) => option.guide && option.href.startsWith("/docs/deployment/")
      )
    );
  }
  const express = getTemplateBySlug("express");
  assert(express);
  const options = buildDeployOptions(express);
  const vercel = options.find((option) => option.provider === "vercel");
  assert(vercel && !vercel.guide);
  assert.equal(
    new URL(vercel.href).searchParams.get("repository-url"),
    express.repositoryUrl
  );
});
