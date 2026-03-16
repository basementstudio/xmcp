import { z } from "zod/v3";

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
  color: z.enum(["auto", "on", "off"]).default("auto"),
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
