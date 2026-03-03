import { z } from "zod/v3";

const webhookSinkSchema = z.object({
  type: z.literal("webhook"),
  url: z.string().min(1),
  method: z.enum(["POST", "PUT"]).default("POST"),
  headers: z.record(z.string()).optional(),
});

const lokiSinkSchema = z.object({
  type: z.literal("loki"),
  url: z.string().min(1),
  headers: z.record(z.string()).optional(),
  tenantId: z.string().optional(),
  labels: z.record(z.string()).default({ source: "xmcp" }),
});

const datadogSinkSchema = z.object({
  type: z.literal("datadog"),
  apiKey: z.string().min(1),
  site: z
    .enum(["us1", "us3", "us5", "eu", "ap1", "ap2", "us1-fed"])
    .default("us1"),
  url: z.string().min(1).optional(),
  ddsource: z.string().default("xmcp"),
  service: z.string().optional(),
  ddtags: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

const observabilitySinkSchema = z.union([
  webhookSinkSchema,
  lokiSinkSchema,
  datadogSinkSchema,
]);

const observabilityRedactionBaseSchema = z.object({
  extraSensitiveKeys: z.array(z.string()).default([]),
  allowedKeys: z.array(z.string()).default([]),
});

const observabilityRedactionSchema = observabilityRedactionBaseSchema
  .partial()
  .transform((val) => {
    const defaults = observabilityRedactionBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );

    return {
      ...defaults,
      ...provided,
    };
  });

const observabilityObjectBaseSchema = z.object({
  enabled: z.boolean().default(true),
  stderr: z.boolean().default(true),
  sinkTimeoutMs: z.number().int().positive().default(1000),
  maxQueueSize: z.number().int().positive().default(1000),
  maxConcurrentSends: z.number().int().positive().default(4),
  onSinkError: z.enum(["silent", "warn"]).default("warn"),
  sinks: z.array(observabilitySinkSchema).default([]),
  redaction: observabilityRedactionSchema.default({}),
});

const observabilityObjectSchema = observabilityObjectBaseSchema
  .partial()
  .transform((val) => {
    const defaults = observabilityObjectBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );

    return {
      ...defaults,
      ...provided,
      redaction: observabilityRedactionSchema.parse(val.redaction ?? {}),
    };
  });

export const observabilityConfigSchema = z.union([
  z.boolean(),
  observabilityObjectSchema,
]);

export type ObservabilityConfig = z.input<typeof observabilityConfigSchema>;
