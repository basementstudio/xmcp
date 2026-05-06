import { test } from "node:test";
import assert from "node:assert";
import {
  transformToolHandler,
  type UserToolResponse,
} from "../transformers/tool";
import { httpRequestContextProvider } from "../../contexts/http-request-context";
import { clientInfoContextProvider } from "../../contexts/client-info-context";

type MinimalExtra = {
  signal: AbortSignal;
  requestId: string;
  sendNotification: (notification: unknown) => Promise<void>;
  sendRequest: (request: unknown, resultSchema: unknown) => Promise<unknown>;
};

const createMinimalExtra = (requestId: string): MinimalExtra => ({
  signal: new AbortController().signal,
  requestId,
  sendNotification: async () => undefined,
  sendRequest: async () => ({}),
});

const invokeHandler = (
  handler: unknown,
  requestId: string
): Promise<UserToolResponse> => {
  const typedHandler = handler as (
    args: Record<string, never>,
    extra: MinimalExtra
  ) => Promise<UserToolResponse>;

  return typedHandler({}, createMinimalExtra(requestId));
};

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
