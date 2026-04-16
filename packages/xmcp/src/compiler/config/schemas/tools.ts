import { z } from "zod/v3";

export const toolsConfigSchema = z
  .object({
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    enable: z.array(z.string()).optional(),
  })
  .refine((val) => !(val.include && val.exclude), {
    message: "Cannot specify both 'include' and 'exclude' in tools config",
  });

export type ToolsConfig = z.infer<typeof toolsConfigSchema>;
