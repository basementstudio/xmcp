import assert from "node:assert/strict";
import { withClient, type ClientDefinition } from "xmcp/client";
import { cancellationProbe } from "../harness/cancellation-probe.js";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";
import type { Target } from "../harness/target.js";
import { getStdioLaunch } from "../harness/targets/stdio.js";

function connection(target: Target) {
  const launch = target.url
    ? undefined
    : getStdioLaunch(target.fixture, "managed");
  const definition: ClientDefinition = target.url
    ? { type: "http", name: "managed", url: target.url }
    : {
        type: "stdio",
        name: "managed",
        ...launch!.parameters,
        args: launch!.parameters.args ?? [],
        stderr: "pipe",
      };
  return {
    definition,
    options: {
      versionNegotiation: { mode: target.mode },
      connect: REQUEST_OPTIONS,
      onStderrData: launch?.onStderrData,
    },
  };
}

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "managed-client",
    "lists and calls tools through the managed client",
    async (target) => {
      const { definition, options } = connection(target);
      const result = await withClient(
        definition,
        async (client) => {
          const { tools } = await client.listTools({}, REQUEST_OPTIONS);
          assert.ok(tools.some((tool) => tool.name === "add"));
          return client.callTool(
            { name: "add", arguments: { a: 2, b: 3 } },
            REQUEST_OPTIONS
          );
        },
        options
      );
      assert.deepEqual(result.structuredContent, { sum: 5 });
    }
  );
  whenSupported(
    "managed-client-interactive",
    "reaches the configured elicitation handler",
    async (target) => {
      const { definition, options } = connection(target);
      let calls = 0;
      const result = await withClient(
        definition,
        (client) => client.callTool({ name: "confirm" }, REQUEST_OPTIONS),
        {
          ...options,
          handlers: {
            elicitation: (request) => {
              calls++;
              assert.equal(request.params.message, "Confirm?");
              return { action: "accept", content: { confirmed: true } };
            },
          },
        }
      );
      assert.equal(calls, 1);
      assert.deepEqual(result.content, [{ type: "text", text: "confirmed" }]);
    }
  );
  whenSupported(
    "managed-client-interactive",
    "propagates cancellation to the server handler",
    async (target) => {
      const { definition, options } = connection(target);
      const probe = await cancellationProbe();
      const controller = new AbortController();
      try {
        await withClient(
          definition,
          async (client) => {
            // SDK 2.0.0 servers ignore cancellation of numeric request id 0.
            // Exercise the usual discover-then-call flow; record the upstream
            // first-request limitation in the client docs instead of patching SDK internals.
            await client.listTools({}, REQUEST_OPTIONS);
            const outcome = client
              .callTool(
                {
                  name: "lifecycle-cancel",
                  arguments: { probeUrl: probe.url },
                },
                {
                  ...REQUEST_OPTIONS,
                  signal: controller.signal,
                }
              )
              .then(
                (result) => ({ result }),
                (error: unknown) => ({ error })
              );
            await Promise.race([
              probe.wait("started"),
              outcome.then((value) => {
                throw new Error(
                  "Tool finished before cancellation: " + JSON.stringify(value)
                );
              }),
            ]);
            controller.abort(new Error("managed client cancelled"));
            const result = await outcome;
            assert.ok("error" in result && result.error instanceof Error);
            assert.match(result.error.message, /managed client cancelled/);
            assert.equal((await probe.wait("handler-aborted")).aborted, true);
            assert.equal(
              (await probe.wait("middleware-finished")).aborted,
              true
            );
          },
          options
        );
      } finally {
        controller.abort();
        await probe.close();
      }
    }
  );
}
