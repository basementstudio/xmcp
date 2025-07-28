import { z } from "zod";

export const betterAuthConfigSchema = z.object({
  database: z.object({
    connectionString: z.string(),
  }),
  baseURL: z.string(),
  secret: z.string(),
  emailAndPassword: z.object({
    enabled: z.boolean(),
  }),
  loginPage: z.string(),
});

export type BetterAuthConfig = z.infer<typeof betterAuthConfigSchema>;
