import { z } from "zod/v3";

const componentSelectorSchema = z
  .object({
    names: z.array(z.string().min(1)).optional(),
    tags: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const componentsConfigSchema = z
  .object({
    include: componentSelectorSchema.optional(),
    exclude: componentSelectorSchema.optional(),
  })
  .strict();

export type ComponentSelector = z.infer<typeof componentSelectorSchema>;
export type ComponentsConfig = z.infer<typeof componentsConfigSchema>;
