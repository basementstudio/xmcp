import { z } from "zod/v3";

const cacheHintSchema = z
  .object({
    ttlMs: z
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .optional(),
    cacheScope: z.enum(["private", "public"]).optional(),
  })
  .strict();

/**
 * Server-wide cache hints for MCP 2026-07-28 cacheable results, keyed by
 * method. Unset methods keep the SDK default (`ttlMs: 0`, `cacheScope:
 * "private"`). Handler- or middleware-returned fields still take precedence.
 */
export const cacheHintsConfigSchema = z
  .object({
    "tools/list": cacheHintSchema.optional(),
    "prompts/list": cacheHintSchema.optional(),
    "resources/list": cacheHintSchema.optional(),
    "resources/templates/list": cacheHintSchema.optional(),
    "resources/read": cacheHintSchema.optional(),
    "server/discover": cacheHintSchema.optional(),
  })
  .strict();

export type CacheHintsConfig = z.infer<typeof cacheHintsConfigSchema>;
