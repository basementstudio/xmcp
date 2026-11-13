import type { Middleware } from "xmcp";
import { apiKeyAuthMiddleware } from "xmcp";
import { z } from "zod";

import { bridge } from "./bridge";

const infoSchema = z.object({
  sessionId: z.uuid(),
  pageId: z.string().min(1),
  documentName: z.string(),
  pageName: z.string(),
});
const resultSchema = z.object({
  sessionId: z.uuid(),
  id: z.uuid(),
  result: z.object({
    isError: z.boolean().optional(),
    content: z.array(
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("text"), text: z.string() }),
        z.object({
          type: z.literal("image"),
          data: z.string(),
          mimeType: z.literal("image/png"),
        }),
      ])
    ),
  }),
});
const authenticate = apiKeyAuthMiddleware({
  validateApiKey: async (key) =>
    Boolean(process.env.MCP_API_KEY?.trim()) && key === process.env.MCP_API_KEY,
});

const middleware: Exclude<Middleware, { router: unknown }> = async (
  request,
  response,
  next
) => {
  if (!request.path.startsWith("/figma/"))
    return authenticate(request, response, next);
  // Figma's sandboxed plugin iframe may have an opaque (null) origin.
  const origin = request.header("origin");
  if (origin && origin !== "null" && origin !== "https://www.figma.com") {
    response.status(403).json({ error: "Origin not allowed" });
    return;
  }
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "content-type,x-figma-bridge-key"
    );
    response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    response.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  if (
    !process.env.FIGMA_BRIDGE_KEY?.trim() ||
    request.header("x-figma-bridge-key") !== process.env.FIGMA_BRIDGE_KEY
  ) {
    response.status(401).json({ error: "Invalid plugin key" });
    return;
  }
  if (request.method !== "POST") {
    response.sendStatus(405);
    return;
  }
  if (request.path === "/figma/poll") {
    const info = infoSchema.safeParse(request.body);
    if (!info.success) {
      response.sendStatus(400);
      return;
    }
    const controller = new AbortController();
    const disconnect = () => controller.abort();
    response.once("close", disconnect);
    try {
      const command = await bridge.poll(info.data, controller.signal);
      if (!response.destroyed) {
        if (command) response.json(command);
        else response.sendStatus(204);
      }
    } catch {
      if (!response.destroyed)
        response.status(409).json({
          error: "Another plugin is connected or a command is still running.",
        });
    } finally {
      response.off("close", disconnect);
    }
    return;
  }
  if (request.path === "/figma/result") {
    const value = resultSchema.safeParse(request.body);
    if (!value.success) {
      response.sendStatus(400);
      return;
    }
    const { sessionId, id, result } = value.data;
    response.sendStatus(bridge.complete(sessionId, id, result) ? 204 : 410);
    return;
  }
  response.sendStatus(404);
};

export default middleware;
