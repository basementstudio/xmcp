import { z } from "zod";

// ------------------------------------------------------------
// Cors config schema
// ------------------------------------------------------------
export const corsConfigSchema = z.object({
  origin: z.union([z.string(), z.array(z.string()), z.boolean()]).default("*"),
  methods: z.union([z.string(), z.array(z.string())]).default(["GET", "POST"]),
  allowedHeaders: z
    .union([z.string(), z.array(z.string())])
    .default([
      "Content-Type",
      "Authorization",
      "mcp-session-id",
      "mcp-protocol-version",
    ]),
  exposedHeaders: z
    .union([z.string(), z.array(z.string())])
    .default(["Content-Type", "Authorization", "mcp-session-id"]),
  credentials: z.boolean().default(false),
  maxAge: z.number().default(86400),
});

export type CorsConfig = z.infer<typeof corsConfigSchema>;

// ------------------------------------------------------------
// HTTP Transport config schema
// ------------------------------------------------------------
const httpTransportObjectSchema = z.object({
  port: z.number().default(3001),
  host: z.string().default("127.0.0.1"),
  bodySizeLimit: z.number().default(1024 * 1024 * 10), // 10MB
  debug: z.boolean().default(false),
  endpoint: z.string().default("/mcp"),
  cors: corsConfigSchema.optional(),
});

// Input schema: accepts boolean or object
export const httpTransportConfigSchema = z.union([
  z.boolean(),
  httpTransportObjectSchema,
]);

// Output schema: transforms boolean → object | null, ensures cors is always present
export const resolvedHttpTransportConfigSchema = httpTransportConfigSchema
  .transform((val) => {
    if (typeof val === "boolean") {
      return val ? null : null; // false → null, true → will be handled below
    }
    return val;
  })
  .pipe(
    z.union([
      z.literal(null),
      httpTransportObjectSchema.extend({
        cors: corsConfigSchema, // Make cors required in output
      }),
    ])
  )
  .transform((val) => {
    if (val === null) return null;
    // Ensure cors is always present
    return {
      ...val,
      cors: val.cors ?? corsConfigSchema.parse({}),
    };
  });

export type HttpTransportConfig = z.input<typeof httpTransportConfigSchema>;
export type ResolvedHttpConfig = z.output<
  typeof resolvedHttpTransportConfigSchema
>;
