// Generated from OpenAPI. Review before deploying.
import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  id: z.string().min(1),
  verbose: z.boolean().optional(),
};

export const metadata: ToolMetadata = {
  name: "get-pet",
  description: "Read a pet from the local example API",
  annotations: {
    readOnlyHint: true,
  },
};

function encode(value: string | number | boolean): string {
  return encodeURIComponent(String(value)).replace(
    /[!'()*]/g,
    (char) => "%" + char.charCodeAt(0).toString(16).toUpperCase()
  );
}

function pathValue(value: string | number | boolean): string {
  // WHATWG URLs normalize even percent-encoded dot segments.
  if (String(value) === "." || String(value) === "..")
    throw new Error("Path parameters cannot be dot segments.");
  return encode(value);
}

export default async function handler(args: InferSchema<typeof schema>) {
  const url = new URL(
    "http://127.0.0.1:3002/api" + ("/pets/" + pathValue(args["id"]))
  );
  const query: string[] = [];
  if (args["verbose"] !== undefined) {
    query.push("verbose=" + encode(args["verbose"]));
  }
  url.search = query.join("&");
  const response = await fetch(url, {
    method: "GET",
    signal: getRequestContext().signal,
  });
  if (!response.ok)
    throw new Error("GET /pets/{id} failed: HTTP " + response.status);
  return response.text();
}
