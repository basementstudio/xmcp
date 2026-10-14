// Generated from OpenAPI. Review before deploying.
import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  id: z.string().min(1),
  "X-Request-Label": z.string().optional(),
  body: z
    .object({ name: z.string().min(1), active: z.boolean().optional() })
    .strict(),
};

export const metadata: ToolMetadata = {
  name: "update-pet",
  description: "Update a pet using JSON, a header and runtime credentials",
  annotations: {
    readOnlyHint: false,
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

  url.search = query.join("&");
  const headers = new Headers();
  function setHeader(name: string, value: string) {
    try {
      headers.set(name, value);
    } catch {
      throw new Error("Invalid value for header " + name + ".");
    }
  }
  if (args["X-Request-Label"] !== undefined)
    setHeader("X-Request-Label", String(args["X-Request-Label"]));
  const authorization = process.env["PET_API_AUTH"];
  if (!authorization?.trim())
    throw new Error("Missing Authorization environment variable PET_API_AUTH.");
  setHeader("Authorization", authorization);
  if (args.body !== undefined) setHeader("Content-Type", "application/json");
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: args.body === undefined ? undefined : JSON.stringify(args.body),
    signal: getRequestContext().signal,
  });
  if (!response.ok)
    throw new Error("PUT /pets/{id} failed: HTTP " + response.status);
  return response.text();
}
