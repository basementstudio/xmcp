import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";
import middleware from "../src/middleware";
import listTeams, {
  schema as teamsSchema,
} from "../src/tools/list-linear-teams";
import listIssues, {
  schema as issuesSchema,
} from "../src/tools/list-linear-issues";
import createIssue, {
  schema as createSchema,
  metadata,
} from "../src/tools/create-linear-issue";

const originalEnv = { ...process.env };
const teamId = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
const issue = {
  id: "issue-id",
  identifier: "ENG-1",
  title: "Fix docs",
  url: "https://linear.app/example/issue/ENG-1",
};
beforeEach(() => {
  process.env.LINEAR_API_KEY = "test-provider-key";
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected network access");
  });
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("team discovery uses personal-key authentication and preserves cursors", async () => {
  const teams = {
    nodes: [{ id: teamId, key: "ENG", name: "Engineering" }],
    pageInfo: { hasNextPage: true, endCursor: "opaque-next" },
  };
  let calls = 0;
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls++;
    assert.equal(url, "https://api.linear.app/graphql");
    assert.equal(init.method, "POST");
    assert.equal(
      new Headers(init.headers).get("Authorization"),
      "test-provider-key"
    );
    assert.equal(new Headers(init.headers).get("x-api-key"), null);
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    const body = JSON.parse(init.body as string);
    assert.match(body.query, /query ListTeams/);
    assert.deepEqual(body.variables, { first: 5, after: "previous" });
    return Response.json({ data: { teams } });
  });
  const result = await listTeams({ limit: 5, after: "previous" });
  assert.deepEqual(JSON.parse(result.content[0].text), { teams });
  assert.equal(calls, 1);
});

test("issue listing filters a team using variables and keeps nullable descriptions", async () => {
  const issues = {
    nodes: [{ ...issue, description: null }],
    pageInfo: { hasNextPage: false, endCursor: null },
  };
  mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    assert.match(body.query, /\$filter: IssueFilter/);
    assert.deepEqual(body.variables, {
      filter: { team: { id: { eq: teamId } } },
      first: 20,
    });
    return Response.json({ data: { issues } });
  });
  const result = await listIssues({ teamId, limit: 20, after: undefined });
  assert.deepEqual(JSON.parse(result.content[0].text), { issues });
});

test("creation sends untrusted text as variables and declares a non-idempotent write", async () => {
  const input = {
    teamId,
    title: 'Text " } mutation {',
    description: "## Finding\nDetails",
  };
  let calls = 0;
  mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    calls++;
    const body = JSON.parse(init.body as string);
    assert.match(body.query, /mutation CreateIssue/);
    assert.ok(!body.query.includes(input.title));
    assert.deepEqual(body.variables, { input });
    return Response.json({ data: { issueCreate: { success: true, issue } } });
  });
  const result = await createIssue(input);
  assert.equal(calls, 1);
  assert.deepEqual(JSON.parse(result.content[0].text).issueCreate.issue, issue);
  assert.equal(metadata.annotations?.readOnlyHint, false);
  assert.equal(metadata.annotations?.idempotentHint, false);
});

test("GraphQL errors with HTTP 200, including partial data, never report success", async () => {
  for (const data of [undefined, { issueCreate: { success: true, issue } }]) {
    mock.method(globalThis, "fetch", async () =>
      Response.json({
        data,
        errors: [
          {
            message: "private provider details",
            extensions: { code: "RATELIMITED" },
          },
        ],
      })
    );
    const result = await createIssue({
      teamId,
      title: "Example",
      description: undefined,
    });
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /private provider details/);
    assert.match(result.content[0].text, /check Linear before retrying/);
  }
});

test("failed mutations and malformed payloads return errors", async () => {
  for (const payload of [
    {},
    { data: null },
    { data: { issueCreate: { success: false, issue: null } } },
    { data: { issueCreate: { success: true, issue: null } } },
  ]) {
    mock.method(globalThis, "fetch", async () => Response.json(payload));
    assert.equal(
      (await createIssue({ teamId, title: "Example", description: undefined }))
        .isError,
      true
    );
  }
});

test("HTTP and network failures are redacted and are not retried", async () => {
  let calls = 0;
  for (const status of [401, 403, 429, 500]) {
    mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json({ message: "secret" }, { status });
    });
    const result = await listTeams({ limit: 20, after: undefined });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, new RegExp(`HTTP ${status}`));
    assert.doesNotMatch(result.content[0].text, /secret/);
  }
  mock.method(globalThis, "fetch", async () => {
    calls++;
    throw new Error("test-provider-key");
  });
  const failed = await createIssue({
    teamId,
    title: "Example",
    description: undefined,
  });
  assert.equal(failed.isError, true);
  assert.doesNotMatch(failed.content[0].text, /test-provider-key/);
  assert.match(failed.content[0].text, /avoid duplicates/);
  assert.equal(calls, 5);
  mock.method(globalThis, "fetch", async () => new Response("not json"));
  assert.equal(
    (await listTeams({ limit: 20, after: undefined })).isError,
    true
  );
});

test("missing keys fail before fetch and schemas constrain creation and pagination", async () => {
  const request = mock.method(globalThis, "fetch", async () => {
    throw new Error("must not fetch");
  });
  delete process.env.LINEAR_API_KEY;
  assert.equal(
    (await listTeams({ limit: 20, after: undefined })).isError,
    true
  );
  assert.equal(request.mock.callCount(), 0);
  assert.equal(z.object(teamsSchema).parse({}).limit, 20);
  for (const limit of [0, 51, 1.5])
    assert.equal(z.object(teamsSchema).safeParse({ limit }).success, false);
  assert.equal(
    z.object(issuesSchema).safeParse({ teamId: "ENG" }).success,
    false
  );
  assert.equal(
    z.object(createSchema).safeParse({ teamId, title: " " }).success,
    false
  );
  assert.equal(
    z.object(createSchema).parse({ teamId, title: " Fix " }).title,
    "Fix"
  );
});

test("MCP authentication fails closed for missing, incorrect, and unconfigured keys", async () => {
  for (const [configured, supplied, allowed] of [
    ["test-client-key", "test-client-key", true],
    ["test-client-key", "wrong", false],
    ["test-client-key", undefined, false],
    ["", "anything", false],
    ["   ", "   ", false],
  ] as const) {
    process.env.MCP_API_KEY = configured;
    let executed = false;
    let status: number | undefined;
    const response = {
      status(code: number) {
        status = code;
        return this;
      },
      json() {},
    };
    await middleware(
      { header: () => supplied } as unknown as Parameters<typeof middleware>[0],
      response as unknown as Parameters<typeof middleware>[1],
      () => {
        executed = true;
      }
    );
    assert.equal(executed, allowed);
    assert.equal(status, allowed ? undefined : 401);
  }
});
