import { test } from "node:test";
import assert from "node:assert";
import {
  transformToolHandler,
  type UserToolResponse,
} from "../transformers/tool";
import { httpRequestContextProvider } from "../../contexts/http-request-context";
import { clientInfoContextProvider } from "../../contexts/client-info-context";
import {
  CLIENT_INFO_META_KEY,
  SdkError,
  SdkErrorCode,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { z } from "zod/v3";

type ContextOptions = {
  envelope?: Record<string, unknown>;
  inputResponses?: Record<string, unknown>;
  requestState?: unknown;
  request?: Request;
  elicitError?: Error;
};

const createServerContext = (
  requestId: string,
  options: ContextOptions = {}
): ServerContext =>
  ({
    sessionId: undefined,
    mcpReq: {
      id: requestId,
      signal: new AbortController().signal,
      _meta: undefined,
      envelope: options.envelope,
      inputResponses: options.inputResponses,
      requestState: () => options.requestState,
      notify: async () => undefined,
      send: async () => ({}),
      elicitInput: async () => {
        if (options.elicitError) throw options.elicitError;
        return { action: "decline" };
      },
    },
    http: options.request ? { req: options.request } : undefined,
  }) as unknown as ServerContext;

const invokeHandler = (
  handler: unknown,
  requestId: string,
  options?: ContextOptions
): Promise<UserToolResponse> => {
  const typedHandler = handler as (
    args: Record<string, never>,
    extra: ServerContext
  ) => Promise<UserToolResponse>;

  return typedHandler({}, createServerContext(requestId, options));
};

test("transformToolHandler prefers modern envelope clientInfo", async () => {
  const transformedHandler = transformToolHandler((_args, extra) => ({
    structuredContent: { clientInfo: extra.clientInfo },
  }));

  const result = await new Promise<UserToolResponse>((resolve, reject) => {
    httpRequestContextProvider(
      {
        id: "request-modern",
        headers: {
          "x-mcp-client-name": "header-client",
          "x-mcp-client-version": "1.0.0",
        },
        clientInfo: { name: "initialize-client", version: "1.0.0" },
      },
      () => {
        invokeHandler(transformedHandler, "rpc-modern", {
          envelope: {
            [CLIENT_INFO_META_KEY]: {
              name: "modern-client",
              version: "2.0.0",
              title: "Modern Client",
            },
          },
        })
          .then(resolve)
          .catch(reject);
      }
    );
  });

  assert.deepStrictEqual(result, {
    structuredContent: {
      clientInfo: {
        name: "modern-client",
        version: "2.0.0",
        title: "Modern Client",
      },
    },
    content: [
      {
        type: "text",
        text: '{"clientInfo":{"name":"modern-client","version":"2.0.0","title":"Modern Client"}}',
      },
    ],
  });
});

test("transformToolHandler exposes multi-round-trip request data", async () => {
  const transformedHandler = transformToolHandler((_args, extra) => ({
    structuredContent: {
      inputResponses: extra.inputResponses,
      requestState: extra.requestState<{ step: number }>(),
    },
  }));

  const result = await invokeHandler(transformedHandler, "rpc-mrtr", {
    inputResponses: { approval: { decision: "accept" } },
    requestState: { step: 2 },
  });

  assert.deepStrictEqual(result, {
    structuredContent: {
      inputResponses: { approval: { decision: "accept" } },
      requestState: { step: 2 },
    },
    content: [
      {
        type: "text",
        text: '{"inputResponses":{"approval":{"decision":"accept"}},"requestState":{"step":2}}',
      },
    ],
  });
});

test("transformToolHandler explains the modern elicitation migration", async () => {
  const transformedHandler = transformToolHandler(async (_args, extra) => {
    await extra.elicit({
      message: "Confirm?",
      requestedSchema: { type: "object", properties: {} },
    });
    return "unreachable";
  });

  await assert.rejects(
    invokeHandler(transformedHandler, "rpc-modern-elicit", {
      elicitError: new SdkError(
        SdkErrorCode.MethodNotSupportedByProtocolVersion,
        "not supported"
      ),
    }),
    /Return inputRequired\(\{ \.\.\. \}\) from the tool handler instead/
  );
});

test("transformToolHandler validates structured output", async () => {
  const transformedHandler = transformToolHandler(
    () => ({ structuredContent: { count: "not-a-number" } }),
    undefined,
    { count: z.number() },
    "count"
  );

  await assert.rejects(
    invokeHandler(transformedHandler, "rpc-invalid-output"),
    /Tool "count" returned structuredContent that does not match outputSchema/
  );
});

test("transformToolHandler forwards clientInfo through tool extra arguments", async () => {
  const transformedHandler = transformToolHandler((args, extra) => {
    return {
      structuredContent: {
        ...args,
        clientInfoName: extra.clientInfo?.name,
        clientInfoVersion: extra.clientInfo?.version,
      },
    };
  });

  const result = await new Promise<UserToolResponse>((resolve, reject) => {
    httpRequestContextProvider(
      {
        id: "request-id",
        headers: {},
        clientInfo: {
          name: "cursor",
          version: "0.50.1",
          title: "Cursor",
        },
      },
      () => {
        invokeHandler(transformedHandler, "rpc-1").then(resolve).catch(reject);
      }
    );
  });

  assert.deepStrictEqual(result, {
    structuredContent: {
      clientInfoName: "cursor",
      clientInfoVersion: "0.50.1",
    },
    content: [
      {
        type: "text",
        text: '{"clientInfoName":"cursor","clientInfoVersion":"0.50.1"}',
      },
    ],
  });
});

test("transformToolHandler prefers initialize clientInfo over request headers", async () => {
  const transformedHandler = transformToolHandler((_args, extra) => {
    return {
      structuredContent: {
        clientInfoName: extra.clientInfo?.name,
        clientInfoVersion: extra.clientInfo?.version,
      },
    };
  });

  const result = await new Promise<UserToolResponse>((resolve, reject) => {
    httpRequestContextProvider(
      {
        id: "request-id-headers-precedence",
        headers: {
          "x-mcp-client-name": "header-client",
          "x-mcp-client-version": "9.9.9",
        },
        clientInfo: {
          name: "initialize-client",
          version: "1.0.0",
        },
      },
      () => {
        invokeHandler(transformedHandler, "rpc-headers-precedence")
          .then(resolve)
          .catch(reject);
      }
    );
  });

  assert.deepStrictEqual(result, {
    structuredContent: {
      clientInfoName: "initialize-client",
      clientInfoVersion: "1.0.0",
    },
    content: [
      {
        type: "text",
        text: '{"clientInfoName":"initialize-client","clientInfoVersion":"1.0.0"}',
      },
    ],
  });
});

test("transformToolHandler uses request headers as HTTP clientInfo fallback", async () => {
  const transformedHandler = transformToolHandler((_args, extra) => {
    return {
      structuredContent: {
        clientInfoName: extra.clientInfo?.name,
        clientInfoVersion: extra.clientInfo?.version,
        clientInfoTitle: extra.clientInfo?.title,
      },
    };
  });

  const result = await new Promise<UserToolResponse>((resolve, reject) => {
    httpRequestContextProvider(
      {
        id: "request-id-headers",
        headers: {
          "X-MCP-Client-Name": "cursor",
          "X-MCP-Client-Version": "0.50.1",
          "X-MCP-Client-Title": "Cursor",
        },
        clientInfo: undefined,
      },
      () => {
        invokeHandler(transformedHandler, "rpc-headers")
          .then(resolve)
          .catch(reject);
      }
    );
  });

  assert.deepStrictEqual(result, {
    structuredContent: {
      clientInfoName: "cursor",
      clientInfoVersion: "0.50.1",
      clientInfoTitle: "Cursor",
    },
    content: [
      {
        type: "text",
        text: '{"clientInfoName":"cursor","clientInfoVersion":"0.50.1","clientInfoTitle":"Cursor"}',
      },
    ],
  });
});

test("transformToolHandler leaves clientInfo undefined when request has no client metadata", async () => {
  const transformedHandler = transformToolHandler((_args, extra) => {
    return {
      structuredContent: {
        hasClientInfo: extra.clientInfo !== undefined,
      },
    };
  });

  const result = await new Promise<UserToolResponse>((resolve, reject) => {
    httpRequestContextProvider(
      {
        id: "request-id-2",
        headers: {},
        clientInfo: undefined,
      },
      () => {
        invokeHandler(transformedHandler, "rpc-2").then(resolve).catch(reject);
      }
    );
  });

  assert.deepStrictEqual(result, {
    structuredContent: {
      hasClientInfo: false,
    },
    content: [
      {
        type: "text",
        text: '{"hasClientInfo":false}',
      },
    ],
  });
});

test("transformToolHandler uses stdio clientInfo context as fallback", async () => {
  const transformedHandler = transformToolHandler((_args, extra) => {
    return {
      structuredContent: {
        clientInfoName: extra.clientInfo?.name,
        clientInfoVersion: extra.clientInfo?.version,
      },
    };
  });

  const result = await new Promise<UserToolResponse>((resolve, reject) => {
    clientInfoContextProvider(
      {
        clientInfo: {
          name: "opencode",
          version: "1.2.3",
        },
      },
      () => {
        invokeHandler(transformedHandler, "rpc-3").then(resolve).catch(reject);
      }
    );
  });

  assert.deepStrictEqual(result, {
    structuredContent: {
      clientInfoName: "opencode",
      clientInfoVersion: "1.2.3",
    },
    content: [
      {
        type: "text",
        text: '{"clientInfoName":"opencode","clientInfoVersion":"1.2.3"}',
      },
    ],
  });
});
