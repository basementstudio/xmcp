import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { load as loadYaml } from "js-yaml";
import {
  BATCH_SIZE,
  ENDPOINT,
  KEY,
  KEY_URL,
  ORIGIN,
  eligibleEvent,
  pageFingerprint,
  runIndexNow,
  sitemapUrls,
} from "./indexnow.mjs";

const url = (path) => `${ORIGIN}${path}`;
const html = (path, text = "Hello", extra = "") =>
  `<html><head><title>Example</title><link rel="canonical" href="${url(path)}">${extra}</head><body><main>${text}</main></body></html>`;
const sitemap = (paths) =>
  `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${url(path)}</loc></url>`).join("")}</urlset>`;

async function fixture(t, paths = ["/docs", "/changelog"]) {
  const directory = await mkdtemp(join(tmpdir(), "xmcp-indexnow-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const snapshotPath = join(directory, "snapshot.json");
  const responses = new Map([
    [KEY_URL, () => new Response(KEY)],
    [url("/sitemap.xml"), () => new Response(sitemap(paths))],
    ...paths.map((path) => [
      url(path),
      () =>
        new Response(html(path), {
          headers: { "content-type": "text/html" },
        }),
    ]),
  ]);
  const posts = [];
  const logs = [];
  const fetchImpl = async (target, options) => {
    assert.equal(options.redirect, "manual");
    if (target === ENDPOINT) {
      assert.equal(options.method, "POST");
      posts.push(JSON.parse(options.body));
      return responses.get(ENDPOINT)?.() ?? new Response(null, { status: 200 });
    }
    assert.ok(responses.has(target), `Unexpected request: ${target}`);
    return responses.get(target)();
  };
  return {
    snapshotPath,
    responses,
    posts,
    logs,
    run: (options) =>
      runIndexNow({
        snapshotPath,
        fetchImpl,
        log: (line) => logs.push(line),
        ...options,
      }),
    setPage: (path, content, status = 200, headers = {}) =>
      responses.set(
        url(path),
        () =>
          new Response(content, {
            status,
            headers: { "content-type": "text/html", ...headers },
          })
      ),
    setSitemap: (paths) =>
      responses.set(url("/sitemap.xml"), () => new Response(sitemap(paths))),
  };
}

test("sitemap deduplicates canonical URLs and rejects unsafe or incomplete inventories", () => {
  assert.deepEqual(sitemapUrls(sitemap(["/docs", "/docs", "/"])), [
    url("/"),
    url("/docs"),
  ]);
  for (const xml of [
    sitemap([]),
    sitemap(["/docs"]).replace(ORIGIN, "https://example.com"),
    sitemap(["/docs?q=x"]),
    sitemap(["/docs#heading"]),
    sitemap(["/docs"]).replace("</urlset>", ""),
    "<sitemapindex><sitemap><loc>https://xmcp.dev/sitemap.xml</loc></sitemap></sitemapindex>",
    '<urlset xmlns="x"><url></url></urlset>',
  ])
    assert.throws(() => sitemapUrls(xml));
});

test("fingerprints ignore runtime scripts, styles, IDs, classes and JSON object order", () => {
  const first = html(
    "/docs",
    '<p class="old" id="react-1">Hello</p><script>build1</script><style>.old{}</style>',
    '<script type="application/ld+json">{"name":"xmcp","@type":"WebPage"}</script>'
  );
  const second = html(
    "/docs",
    '<p class="new" id="react-2">Hello</p><script nonce="new">build2</script><style>.new{}</style>',
    '<script type="application/ld+json">{"@type":"WebPage","name":"xmcp"}</script>'
  );
  assert.equal(
    pageFingerprint(first, url("/docs")).hash,
    pageFingerprint(second, url("/docs")).hash
  );
});

test("fingerprints detect text, metadata, links, images and structured-data changes", () => {
  const base = pageFingerprint(html("/docs"), url("/docs")).hash;
  for (const changed of [
    html("/docs", "Updated"),
    html("/docs", "Hello", '<meta name="description" content="Changed">'),
    html("/docs", '<a href="/changed">Hello</a>'),
    html("/docs", '<img src="/changed.webp" alt="Example">Hello'),
    html(
      "/docs",
      "Hello",
      '<script type="application/ld+json">{"name":"changed"}</script>'
    ),
  ])
    assert.notEqual(pageFingerprint(changed, url("/docs")).hash, base);
  assert.throws(
    () => pageFingerprint(html("/other"), url("/docs")),
    /Canonical/
  );
  assert.equal(
    pageFingerprint(html("/docs"), url("/docs"), "noindex").noindex,
    true
  );
});

test("initial submission covers the sitemap; unchanged reruns send nothing; additions and edits send only deltas", async (t) => {
  const f = await fixture(t);
  await f.run();
  assert.deepEqual(f.posts[0], {
    host: "xmcp.dev",
    key: KEY,
    keyLocation: KEY_URL,
    urlList: [url("/changelog"), url("/docs")],
  });
  assert.match(f.logs[0], /No baseline/);
  await f.run();
  assert.equal(f.posts.length, 1);
  f.setSitemap(["/docs", "/changelog", "/new", "/new"]);
  f.setPage("/new", html("/new"));
  f.setPage("/docs", html("/docs", "Updated"));
  await f.run();
  assert.deepEqual(f.posts[1].urlList, [url("/docs"), url("/new")]);
});

test("dry runs neither submit nor create or advance state and do not need a deployed key", async (t) => {
  const f = await fixture(t);
  f.responses.delete(KEY_URL);
  await f.run({ dryRun: true });
  assert.equal(f.posts.length, 0);
  await assert.rejects(readFile(f.snapshotPath), { code: "ENOENT" });
  f.responses.set(KEY_URL, () => new Response(KEY));
  await f.run();
  const before = await readFile(f.snapshotPath, "utf8");
  f.setPage("/docs", html("/docs", "Updated"));
  await f.run({ dryRun: true });
  assert.equal(await readFile(f.snapshotPath, "utf8"), before);
  assert.equal(f.posts.length, 1);
});

test("404, 410, redirects and explicit noindex confirm removals; sitemap absence alone does not", async (t) => {
  const paths = [
    "/keep",
    "/404",
    "/410",
    "/redirect",
    "/meta",
    "/header",
    "/absent",
  ];
  const f = await fixture(t, paths);
  await f.run();
  f.setSitemap(["/keep"]);
  f.setPage("/404", "Gone", 404);
  f.setPage("/410", "Gone", 410);
  f.setPage("/redirect", "", 308, { location: "/keep" });
  f.setPage(
    "/meta",
    html("/keep", "Hidden", '<meta name="robots" content="noindex">')
  );
  f.setPage("/header", html("/header"), 200, { "x-robots-tag": "noindex" });
  const result = await f.run();
  assert.deepEqual(
    result.removed.sort(),
    ["/404", "/410", "/header", "/meta", "/redirect"].map(url)
  );
  assert.deepEqual(
    Object.keys(
      JSON.parse(await readFile(f.snapshotPath, "utf8")).pages
    ).sort(),
    [url("/absent"), url("/keep")]
  );
  await f.run();
  assert.equal(f.posts.length, 2);
});

test("key mismatch, failed/incomplete crawl, and rejected submissions preserve the baseline", async (t) => {
  for (const scenario of [
    "key",
    "sitemap",
    "page",
    "noindex",
    "canonical",
    "network",
    "403",
    "429",
    "500",
  ]) {
    await t.test(scenario, async (t) => {
      const f = await fixture(t);
      await f.run();
      const before = await readFile(f.snapshotPath, "utf8");
      f.setPage("/docs", html("/docs", "Updated"));
      if (scenario === "key")
        f.responses.set(KEY_URL, () => new Response("wrong"));
      else if (scenario === "sitemap")
        f.responses.set(url("/sitemap.xml"), () => new Response("<urlset>"));
      else if (scenario === "page") f.setPage("/changelog", "Error", 500);
      else if (scenario === "noindex")
        f.setPage("/changelog", html("/changelog"), 200, {
          "x-robots-tag": "noindex",
        });
      else if (scenario === "canonical")
        f.setPage("/changelog", html("/different"));
      else if (scenario === "network")
        f.responses.set(url("/changelog"), () => {
          throw new Error("Network failure");
        });
      else
        f.responses.set(
          ENDPOINT,
          () => new Response(null, { status: Number(scenario) })
        );
      await assert.rejects(f.run());
      assert.equal(await readFile(f.snapshotPath, "utf8"), before);
      if (!/^\d+$/.test(scenario)) assert.equal(f.posts.length, 1);
    });
  }
});

test("202 is recorded as pending validation, and malformed state never silently resets", async (t) => {
  const f = await fixture(t);
  f.responses.set(ENDPOINT, () => new Response(null, { status: 202 }));
  await f.run();
  assert.ok(f.logs.some((line) => line.includes("validation pending (202)")));
  await writeFile(f.snapshotPath, '{"version":99}');
  await assert.rejects(f.run(), /Invalid IndexNow snapshot/);
  assert.equal(f.posts.length, 1);
});

test("batches respect the protocol limit and partial submission failure does not create a baseline", async (t) => {
  const paths = Array.from({ length: BATCH_SIZE + 1 }, (_, i) => `/page-${i}`);
  const f = await fixture(t, paths);
  f.responses.set(
    ENDPOINT,
    () => new Response(null, { status: f.posts.length === 2 ? 429 : 200 })
  );
  await assert.rejects(f.run(), /429/);
  assert.equal(f.posts[0].urlList.length, BATCH_SIZE);
  assert.equal(f.posts[1].urlList.length, 1);
  await assert.rejects(readFile(f.snapshotPath), { code: "ENOENT" });
});

test("only the website's successful Vercel production events and main manual runs are eligible", () => {
  const event = {
    repository: { full_name: "basementstudio/xmcp" },
    deployment_status: {
      state: "success",
      environment: "Production",
      creator: { login: "vercel[bot]" },
      environment_url: "https://xmcp-website-example-xmcp-dev.vercel.app",
    },
  };
  assert.equal(eligibleEvent("deployment_status", event), true);
  assert.equal(
    eligibleEvent("workflow_dispatch", event, "refs/heads/main"),
    true
  );
  assert.equal(
    eligibleEvent("workflow_dispatch", event, "refs/heads/feature"),
    false
  );
  assert.equal(eligibleEvent("pull_request", event), false);
  assert.equal(
    eligibleEvent("deployment_status", {
      ...event,
      repository: { full_name: "fork/xmcp" },
    }),
    false
  );
  for (const change of [
    { state: "failure" },
    { state: "pending" },
    { environment: "Preview" },
    { creator: { login: "someone" } },
    { environment_url: "https://other-project.vercel.app" },
    { environment_url: "https://xmcp-website-example.vercel.app.attacker.com" },
  ])
    assert.equal(
      eligibleEvent("deployment_status", {
        ...event,
        deployment_status: { ...event.deployment_status, ...change },
      }),
      false
    );
});

test("workflow restores only retained snapshots from successful runs, across pagination", async () => {
  const workflow = loadYaml(
    await readFile(
      new URL("../../../.github/workflows/indexnow.yml", import.meta.url),
      "utf8"
    )
  );
  const script = workflow.jobs.submit.steps.find(
    (step) => step.id === "baseline"
  ).with.script;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const findBaseline = new AsyncFunction("github", "context", "core", script);
  const output = {};
  const visited = [];
  const artifacts = {
    4: [], // A successful dry run has no baseline.
    3: [
      {
        name: "indexnow-snapshot",
        expired: true,
        expires_at: "2000-01-01T00:00:00Z",
      },
    ],
    2: [
      {
        name: "indexnow-snapshot",
        expired: false,
        expires_at: "2999-01-01T00:00:00Z",
      },
    ],
  };
  const paginate = async (_method, { run_id }) => {
    visited.push(run_id);
    return artifacts[run_id];
  };
  paginate.iterator = async function* (_method, options) {
    assert.equal(options.workflow_id, "indexnow.yml");
    assert.equal(options.status, "success");
    yield { data: [{ id: 5 }, { id: 4 }, { id: 3 }] };
    yield { data: [{ id: 2 }, { id: 1 }] };
  };
  const github = {
    paginate,
    rest: {
      actions: {
        listWorkflowRuns: "runs",
        listWorkflowRunArtifacts: "artifacts",
      },
    },
  };
  const core = {
    setOutput: (key, value) => {
      output[key] = value;
    },
    notice: (value) => {
      output.notice = value;
    },
  };
  const context = { repo: { owner: "basementstudio", repo: "xmcp" }, runId: 5 };
  await findBaseline(github, context, core);
  assert.deepEqual(output, { run_id: "2" });
  assert.deepEqual(visited, [4, 3, 2]);
  delete output.run_id;
  artifacts[2] = [];
  artifacts[1] = [];
  await findBaseline(github, context, core);
  assert.equal(output.run_id, undefined);
  assert.match(output.notice, /fresh sitemap baseline/);
  github.paginate.iterator = async function* () {
    throw new Error("GitHub unavailable");
  };
  await assert.rejects(
    findBaseline(github, context, core),
    /GitHub unavailable/
  );
  assert.equal(workflow.concurrency["cancel-in-progress"], false);
  const upload = workflow.jobs.submit.steps.find((step) =>
    step.uses?.startsWith("actions/upload-artifact@")
  );
  assert.equal(upload.if, "steps.submit.outputs.submitted == 'true'");
});
