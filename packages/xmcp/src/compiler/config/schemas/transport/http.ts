import { z } from "zod/v3";

// ------------------------------------------------------------
// Cors config schema
// ------------------------------------------------------------
// Base schema with defaults - used for parsing with defaults applied
const corsConfigBaseSchema = z.object({
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

// Input schema - all fields optional for partial configs
export const corsConfigSchema = corsConfigBaseSchema
  .partial()
  .transform((val) => {
    const defaults = corsConfigBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );
    const result = {
      ...defaults,
      ...provided,
    };

    if (Array.isArray(result.allowedHeaders)) {
      const headers = new Set(result.allowedHeaders);
      headers.add("mcp-session-id");
      headers.add("mcp-protocol-version");
      result.allowedHeaders = Array.from(headers);
    }
    if (Array.isArray(result.exposedHeaders)) {
      const headers = new Set(result.exposedHeaders);
      headers.add("mcp-session-id");
      result.exposedHeaders = Array.from(headers);
    }

    return result;
  });

export type CorsConfig = z.infer<typeof corsConfigSchema>;

// ------------------------------------------------------------
// HTTP Transport config schema
// ------------------------------------------------------------
// Base schema with defaults - used for parsing with defaults applied
const httpTransportObjectBaseSchema = z.object({
  port: z.number().default(3001),
  host: z.string().default("127.0.0.1"),
  bodySizeLimit: z.number().default(1024 * 1024 * 10), // 10MB
  debug: z.boolean().default(false),
  endpoint: z.string().default("/mcp"),
  cors: corsConfigSchema,
});

// Input schema - all fields optional for partial configs
const httpTransportObjectSchema = httpTransportObjectBaseSchema
  .partial()
  .transform((val) => {
    // Merge provided values with defaults, filtering out undefined values
    const defaults = httpTransportObjectBaseSchema.parse({
      cors: {},
    });
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );
    return {
      ...defaults,
      ...provided,
    };
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
      return val ? {} : null; // false → null, true → will be handled below
    }
    return val;
  })
  .pipe(
    z.union([
      z.literal(null),
      // httpTransportObjectSchema already handles merging defaults in its transform
      httpTransportObjectSchema,
    ])
  );

export type HttpTransportConfig = z.input<typeof httpTransportConfigSchema>;
export type ResolvedHttpConfig = z.output<
  typeof resolvedHttpTransportConfigSchema
>;
