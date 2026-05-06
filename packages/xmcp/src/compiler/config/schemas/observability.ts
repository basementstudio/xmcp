import { z } from "zod/v3";

const observabilityConfigBaseSchema = z.object({
  /** Enables execution logs for tools, prompts, and resources */
  enabled: z.boolean().default(false),
  /** Includes the incoming input payload in start logs */
  includeInput: z.boolean().default(true),
});

export const observabilityConfigSchema = observabilityConfigBaseSchema
  .partial()
  .transform((val) => {
    const defaults = observabilityConfigBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, value]) => value !== undefined)
    );

    return {
      ...defaults,
      ...provided,
    };
  });

export type ObservabilityConfig = z.infer<typeof observabilityConfigSchema>;
