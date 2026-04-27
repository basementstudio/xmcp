import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  recordId: z.string().max(64).describe("ID of the record to delete"),
};

export const metadata: ToolMetadata = {
  name: "delete_record",
  description: "Delete a record from the table by id.",
};

export default async function deleteRecord({
  recordId,
}: InferSchema<typeof schema>) {
  return `deleted ${recordId}`;
}
