import { z } from "zod";

/** FLUX.2 [pro] outputs up to about 4 megapixels. */
const MAX_DIMENSION = 4096;

export const outputOptions = {
  width: z.number().int().min(64).max(MAX_DIMENSION).optional(),
  height: z.number().int().min(64).max(MAX_DIMENSION).optional(),
  seed: z.number().int().optional(),
  safetyTolerance: z
    .number()
    .int()
    .min(0)
    .max(5)
    .default(2)
    .describe("0 is strictest, 5 is most permissive"),
  outputFormat: z.enum(["jpeg", "png", "webp"]).default("jpeg"),
};
