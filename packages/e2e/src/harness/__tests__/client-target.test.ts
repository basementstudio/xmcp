import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { prepareClientTarget, type ClientTarget } from "../client-target.js";
import { REQUEST_TIMEOUT_MS } from "../constants.js";
import type { Fixture } from "../fixture.js";

async function hostFixture(source: string): Promise<Fixture> {
  const directory = await mkdtemp(join(tmpdir(), "xmcp-client-target-"));
  await writeFile(join(directory, "host.cjs"), source);
  return {
    spec: { kind: "express", moduleType: "commonjs" },
    label: "client-target-host",
    directory,
    dispose: () => rm(directory, { recursive: true, force: true }),
  };
}

test("starts an HTTP fixture without connecting a client and closes its listener", async (context) => {
  const fixture = await hostFixture(
    `const http = require("node:http");
let requests = 0;
const server = http.createServer((_request, response) => response.end(String(++requests)));
server.listen(0, "127.0.0.1", () => console.log("E2E_READY http://127.0.0.1:" + server.address().port + "/mcp"));
`
  );
  let target: ClientTarget | undefined;
  context.after(async () => {
    try {
      if (target?.type === "http") await target.close();
    } finally {
      await fixture.dispose();
    }
  });
  target = await prepareClientTarget(fixture);
  assert.equal(target.type, "http");
  const response = await fetch(target.url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  assert.equal(await response.text(), "1");
  await target.close();
  await assert.rejects(
    fetch(target.url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  );
});

test("reports early HTTP fixture exits and keeps startup diagnostics", async (context) => {
  const fixture = await hostFixture(
    'throw new Error("fixture startup failed");\n'
  );
  context.after(() => fixture.dispose());
  await assert.rejects(prepareClientTarget(fixture), /fixture startup failed/);
  assert.match(
    await readFile(join(fixture.directory, "server-client.log"), "utf8"),
    /fixture startup failed/
  );
});
