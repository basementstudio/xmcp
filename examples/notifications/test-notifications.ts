/**
 * Test client that sends MCP notifications to a running xmcp server.
 *
 * Usage:
 *   1. Start the server:  pnpm dev
 *   2. In another terminal: pnpm run test:notifications
 *   3. Watch the server terminal for handler output.
 *
 * Adjust SERVER_URL if your server starts on a different port.
 */

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001/mcp";

async function sendJsonRpc(
  method: string,
  params?: Record<string, unknown>,
  id?: number
) {
  const body: Record<string, unknown> = {
    jsonrpc: "2.0",
    method,
  };
  if (params) body.params = params;
  if (id !== undefined) body.id = id;

  const res = await fetch(SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (id !== undefined) {
    return res.json();
  }
  return { status: res.status };
}

async function sendBatch(messages: Record<string, unknown>[]) {
  const res = await fetch(SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
  });
  return res.json();
}

async function main() {
  console.log("Testing xmcp Notification Subscriptions");
  console.log(`Server: ${SERVER_URL}\n`);

  // 1. Initialize session
  console.log("1. Initializing MCP session...");
  const initResult = await sendJsonRpc(
    "initialize",
    {
      protocolVersion: "2025-03-26",
      capabilities: { roots: { listChanged: true } },
      clientInfo: { name: "notification-test-client", version: "1.0.0" },
    },
    1
  );
  console.log(
    `   Server: ${initResult.result?.serverInfo?.name ?? "connected"}`
  );

  // Send initialized notification
  await sendJsonRpc("notifications/initialized");
  console.log("   Done.\n");

  // 2. roots/list_changed (batched with a request to share the session)
  console.log("2. Sending notifications/roots/list_changed...");
  await sendBatch([
    { jsonrpc: "2.0", method: "notifications/roots/list_changed" },
    { jsonrpc: "2.0", method: "tools/list", id: 2 },
  ]);
  console.log(
    "   Expected: [notification] Roots list changed — workspace context may need updating\n"
  );

  // 3. notifications/cancelled
  console.log("3. Sending notifications/cancelled...");
  await sendJsonRpc("notifications/cancelled", {
    requestId: "req-42",
    reason: "User clicked cancel",
  });
  console.log(
    "   Expected: [notification] Request req-42 was cancelled: User clicked cancel\n"
  );

  // 4. notifications/progress
  console.log("4. Sending notifications/progress...");
  await sendJsonRpc("notifications/progress", {
    progressToken: "token-abc",
    progress: 75,
    total: 100,
    message: "Almost done",
  });
  console.log(
    "   Expected: [notification] Progress (75%): Almost done\n"
  );

  console.log("All notifications sent. Check the server terminal for output.");
}

main().catch(console.error);
