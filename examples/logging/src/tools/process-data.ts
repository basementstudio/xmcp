import { z } from "zod";
import { type InferSchema, type ToolMetadata, logger } from "xmcp";

export const schema = {
  source: z.string().describe("The data source to process (e.g. 'users', 'orders')"),
};

export const metadata: ToolMetadata = {
  name: "process-data",
  description: "Process data from a source, demonstrating structured logging at each step",
  annotations: {
    title: "Process Data",
    readOnlyHint: true,
  },
};

export default async function processData({ source }: InferSchema<typeof schema>) {
  logger.info(`Starting data processing for "${source}"`, "process-data");

  // Step 1: Validate the source
  logger.debug({ step: "validate", source }, "process-data");
  const validSources = ["users", "orders", "products"];
  if (!validSources.includes(source)) {
    logger.warning(
      `Unknown source "${source}", proceeding with defaults`,
      "process-data"
    );
  }

  // Step 2: Fetch records
  logger.info("Fetching records...", "process-data");
  const records = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `${source}-item-${i + 1}`,
  }));
  logger.debug({ step: "fetch", recordCount: records.length }, "process-data");

  // Step 3: Process each record
  for (const record of records) {
    logger.debug({ step: "process", recordId: record.id }, "process-data");
  }

  logger.info(
    `Completed processing ${records.length} records from "${source}"`,
    "process-data"
  );

  return `Processed ${records.length} records from "${source}"`;
}
