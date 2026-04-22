import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// Pretend DB client — the rule doesn't care if the import resolves.
type Db = { query: (sql: string) => Promise<unknown> };
const db: Db = { query: async () => [] };

// `.describe()` missing and no `.max()` cap — triggers XMCP-SCHEMA-002, 004
export const schema = {
  name: z.string(),
};

// Empty description — triggers XMCP-META-004
export const metadata: ToolMetadata = {
  name: "sql-lookup",
  description: "",
  annotations: {
    title: "SQL Lookup",
    readOnlyHint: true,
  },
};

export default async function sqlLookup({ name }: InferSchema<typeof schema>) {
  // Template-string SQL with handler input — triggers XMCP-HANDLER-005
  return db.query(`SELECT * FROM users WHERE name = '${name}'`);
}
