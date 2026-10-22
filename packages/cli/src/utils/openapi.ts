import { toFileSafeName } from "./naming.js";
import {
  object,
  parameterSchema,
  resolveObject,
  type JsonObject,
} from "./openapi-schema.js";

export interface OpenApiOptions {
  operations?: string[];
  baseUrl?: string;
}
export interface OpenApiTool {
  name: string;
  operation: string;
  content: string;
}
interface Parameter {
  name: string;
  in: "path" | "query";
  code: string;
  array: boolean;
  explode: boolean;
}
const METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
];

function parameters(
  document: JsonObject,
  pathItem: JsonObject,
  operation: JsonObject,
  path: string,
  label: string
): Parameter[] {
  const merged = new Map<string, JsonObject>();
  for (const list of [pathItem.parameters, operation.parameters]) {
    if (list === undefined) continue;
    if (!Array.isArray(list))
      throw new Error(`${label}: parameters must be an array.`);
    const seen = new Set<string>();
    for (const raw of list) {
      const param = resolveObject(document, raw, `${label} parameter`);
      if (
        typeof param.name !== "string" ||
        !param.name ||
        !["path", "query"].includes(String(param.in))
      )
        throw new Error(
          `${label}: only named path and query parameters are supported.`
        );
      const key = JSON.stringify([param.in, param.name]);
      if (seen.has(key))
        throw new Error(
          `${label}: duplicate ${param.in} parameter ${param.name}.`
        );
      seen.add(key);
      merged.set(key, param);
    }
  }
  const names = new Set<string>();
  const params = [...merged.values()].map((param): Parameter => {
    const name = param.name as string;
    const location = `${label} parameter ${name}`;
    if (names.has(name))
      throw new Error(`${location}: path and query names must be distinct.`);
    names.add(name);
    if (["__proto__", "constructor", "prototype"].includes(name))
      throw new Error(`${location}: unsupported parameter name.`);
    const source = param.in as "path" | "query";
    if (param.required !== undefined && typeof param.required !== "boolean")
      throw new Error(`${location}: required must be boolean.`);
    if (
      source === "path" &&
      (param.required !== true || !path.includes(`{${name}}`))
    )
      throw new Error(
        `${location}: path parameters must be required and appear in the path.`
      );
    if (
      param.content !== undefined ||
      param.allowReserved === true ||
      param.allowEmptyValue === true
    )
      throw new Error(
        `${location}: content, allowReserved and allowEmptyValue are unsupported.`
      );
    const style = source === "path" ? "simple" : "form";
    if (param.style !== undefined && param.style !== style)
      throw new Error(`${location}: only ${style} serialization is supported.`);
    if (param.explode !== undefined && typeof param.explode !== "boolean")
      throw new Error(`${location}: explode must be boolean.`);
    const schema = parameterSchema(
      document,
      param.schema,
      location,
      source === "query"
    );
    let code = schema.code;
    if (typeof param.description === "string")
      code += `.describe(${JSON.stringify(param.description)})`;
    if (param.required !== true) code += ".optional()";
    return {
      name,
      in: source,
      code,
      array: schema.array,
      explode: param.explode !== false,
    };
  });
  for (const match of path.matchAll(/\{([^{}]+)\}/g))
    if (!params.some((param) => param.in === "path" && param.name === match[1]))
      throw new Error(`${label}: missing path parameter ${match[1]}.`);
  return params;
}

function serverUrl(
  document: JsonObject,
  path: JsonObject,
  operation: JsonObject,
  override: string | undefined,
  label: string
): string {
  let url: unknown = override;
  if (url === undefined) {
    const servers = operation.servers ?? path.servers ?? document.servers;
    if (!Array.isArray(servers) || !servers.length)
      throw new Error(
        `${label}: provide an absolute server URL or --base-url.`
      );
    const server = object(servers[0], `${label} server`);
    if (server.variables !== undefined)
      throw new Error(`${label}: server variables require --base-url.`);
    url = server.url;
  }
  if (typeof url !== "string" || /[{}]/.test(url))
    throw new Error(`${label}: invalid server URL; use --base-url.`);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label}: server URL must be absolute; use --base-url.`);
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  )
    throw new Error(
      `${label}: server URL must be HTTP(S) without credentials, query, or fragment.`
    );
  return parsed.href.replace(/\/+$/, "");
}

function template(
  name: string,
  description: string,
  path: string,
  base: string,
  params: Parameter[]
): string {
  const shape = params
    .map((param) => `  ${JSON.stringify(param.name)}: ${param.code},`)
    .join("\n");
  const pathCode = path
    .split(/(\{[^{}]+\})/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("{")
        ? `pathValue(args[${JSON.stringify(part.slice(1, -1))}])`
        : JSON.stringify(part)
    )
    .join(" + ");
  const query = params
    .filter((param) => param.in === "query")
    .map((param) => {
      const value = `args[${JSON.stringify(param.name)}]`;
      const key = JSON.stringify(
        encodeURIComponent(param.name).replace(
          /[!'()*]/g,
          (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
        ) + "="
      );
      const append = param.array
        ? param.explode
          ? `for (const item of ${value}) query.push(${key} + encode(item));`
          : `query.push(${key} + ${value}.map(encode).join(","));`
        : `query.push(${key} + encode(${value}));`;
      return `  if (${value} !== undefined) { ${append} }`;
    })
    .join("\n");
  return `// Generated from OpenAPI. Review before deploying.
import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
${shape}
};

export const metadata: ToolMetadata = ${JSON.stringify({ name, description, annotations: { readOnlyHint: true } }, null, 2)};

function encode(value: string | number | boolean): string {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (char) => "%" + char.charCodeAt(0).toString(16).toUpperCase());
}

function pathValue(value: string | number | boolean): string {
  // WHATWG URLs normalize even percent-encoded dot segments.
  if (String(value) === "." || String(value) === "..") throw new Error("Path parameters cannot be dot segments.");
  return encode(value);
}

export default async function handler(args: InferSchema<typeof schema>) {
  const url = new URL(${JSON.stringify(base)} + (${pathCode}));
  const query: string[] = [];
${query}
  url.search = query.join("&");
  const response = await fetch(url, { method: "GET", signal: getRequestContext().signal });
  if (!response.ok) throw new Error(${JSON.stringify(`GET ${path} failed: HTTP `)} + response.status);
  return response.text();
}
`;
}

export function buildOpenApiTools(
  input: unknown,
  options: OpenApiOptions = {}
): OpenApiTool[] {
  const document = object(input, "OpenAPI document");
  if (
    typeof document.openapi !== "string" ||
    !/^3\.[01]\.\d+$/.test(document.openapi)
  )
    throw new Error("Only OpenAPI 3.0 and 3.1 JSON documents are supported.");
  if (
    document.jsonSchemaDialect !== undefined &&
    document.jsonSchemaDialect !==
      "https://spec.openapis.org/oas/3.1/dialect/base"
  )
    throw new Error("Custom JSON Schema dialects are unsupported.");
  const paths = object(document.paths, "OpenAPI paths");
  const candidates: {
    path: string;
    item: JsonObject;
    method: string;
    op: JsonObject;
    id: string;
    label: string;
  }[] = [];
  const ids = new Set<string>();
  for (const [path, value] of Object.entries(paths)) {
    if (path.startsWith("x-")) continue;
    const item = object(value, path);
    if (item.$ref !== undefined)
      throw new Error(`${path}: path-item references are unsupported.`);
    for (const method of METHODS) {
      if (!Object.hasOwn(item, method)) continue;
      const op = object(item[method], `${method.toUpperCase()} ${path}`);
      const label = `${method.toUpperCase()} ${path}`;
      if (
        op.operationId !== undefined &&
        (typeof op.operationId !== "string" || !op.operationId.trim())
      )
        throw new Error(`${label}: invalid operationId.`);
      const id = typeof op.operationId === "string" ? op.operationId : label;
      if (ids.has(id)) throw new Error(`Duplicate operation selector ${id}.`);
      ids.add(id);
      candidates.push({ path, item, method, op, id, label });
    }
  }
  const selected = options.operations?.length
    ? new Set(options.operations)
    : undefined;
  if (selected)
    for (const id of selected)
      if (!ids.has(id)) throw new Error(`Unknown operation ${id}.`);
  const names = new Set<string>();
  const tools = candidates
    .filter((candidate) =>
      selected ? selected.has(candidate.id) : candidate.method === "get"
    )
    .map(({ path, item, method, op, id, label }) => {
      if (method !== "get")
        throw new Error(`${label}: only GET operations are supported.`);
      if (
        !path.startsWith("/") ||
        /[?#\\]/.test(path) ||
        /[{}]/.test(path.replace(/\{[^{}]+\}/g, "")) ||
        path
          .split("/")
          .some((part) => [".", ".."].includes(part.replace(/%2e/gi, ".")))
      )
        throw new Error(`${label}: unsupported path template.`);
      if (op.requestBody !== undefined || op.callbacks !== undefined)
        throw new Error(
          `${label}: request bodies and callbacks are unsupported.`
        );
      const security = op.security ?? document.security ?? [];
      if (!Array.isArray(security) || security.length)
        throw new Error(
          `${label}: authenticated operations are unsupported in this importer.`
        );
      const name = toFileSafeName(id);
      if (
        name.length > 128 ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(name)
      )
        throw new Error(
          `${label}: operation name cannot be used as a portable tool filename.`
        );
      if (names.has(name))
        throw new Error(`Operations normalize to the same tool name: ${name}.`);
      names.add(name);
      const params = parameters(document, item, op, path, label);
      const base = serverUrl(document, item, op, options.baseUrl, label);
      const description =
        typeof op.description === "string"
          ? op.description
          : typeof op.summary === "string"
            ? op.summary
            : label;
      return {
        name,
        operation: label,
        content: template(name, description, path, base, params),
      };
    });
  if (!tools.length) throw new Error("No GET operations selected.");
  return tools;
}
