export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface EnqueueInput {
  /** An actor name the bridge allowlists. */
  actor: string;
  args?: JsonValue[];
  kwargs?: Record<string, JsonValue>;
}

/**
 * The bridge's view of a job. `unavailable` means no result is stored yet or
 * anymore; Dramatiq cannot tell whether the job is queued, running, or lost.
 */
export type JobResult =
  | { status: "succeeded"; result: JsonValue }
  | { status: "failed"; error: string }
  | { status: "unavailable" }
  | { status: "not_found" };

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface DramatiqClientConfig {
  /** Bridge origin and optional base path, such as `https://jobs.internal`. */
  baseUrl: string;
  /** Bearer token the bridge requires on every request. */
  token: string;
}

export interface DramatiqClient {
  enqueue(
    input: EnqueueInput,
    options?: RequestOptions
  ): Promise<{ jobId: string }>;
  getResult(jobId: string, options?: RequestOptions): Promise<JobResult>;
}

/** The bridge rejected a request, such as with 401, 422, or 503. */
export class DramatiqBridgeError extends Error {
  constructor(public readonly status: number) {
    super(`Dramatiq bridge returned HTTP ${status}`);
    this.name = "DramatiqBridgeError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Creates a client for the xmcp Dramatiq HTTP bridge. The token is sent only
 * to `baseUrl`: redirects are rejected and requests are never retried, so a
 * failed enqueue cannot create duplicate jobs.
 */
export function createDramatiqClient(
  config: DramatiqClientConfig
): DramatiqClient {
  const base = new URL(config.baseUrl);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw new Error(
      "baseUrl must be an HTTP(S) URL without credentials, query, or fragment"
    );
  }
  if (!config.token.trim()) throw new Error("A bridge token is required");
  base.pathname = `${base.pathname.replace(/\/$/, "")}/`;

  function request(path: string, init: RequestInit) {
    return fetch(new URL(path, base), {
      ...init,
      redirect: "error",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.token}`,
      },
    });
  }

  return {
    async enqueue(input, options = {}) {
      if (!input.actor?.trim()) throw new Error("An actor is required");
      const response = await request("v1/jobs", {
        method: "POST",
        body: JSON.stringify(input),
        signal: options.signal,
      });
      if (response.status !== 202)
        throw new DramatiqBridgeError(response.status);
      const body: unknown = await response.json();
      if (!isObject(body) || typeof body.jobId !== "string" || !body.jobId) {
        throw new Error("Invalid bridge job response");
      }
      return { jobId: body.jobId };
    },

    async getResult(jobId, options = {}) {
      if (!jobId.trim()) throw new Error("A job ID is required");
      const response = await request(`v1/jobs/${encodeURIComponent(jobId)}`, {
        method: "GET",
        signal: options.signal,
      });
      if (response.status === 404) return { status: "not_found" };
      if (!response.ok) throw new DramatiqBridgeError(response.status);
      const body: unknown = await response.json();
      if (isObject(body)) {
        if (body.status === "unavailable") return { status: "unavailable" };
        if (body.status === "succeeded" && "result" in body) {
          return { status: "succeeded", result: body.result as JsonValue };
        }
        if (body.status === "failed" && typeof body.error === "string") {
          return { status: "failed", error: body.error };
        }
      }
      throw new Error("Invalid bridge result response");
    },
  };
}
