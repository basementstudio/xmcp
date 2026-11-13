import type { InferSchema } from "xmcp";
import { z } from "zod";

export const reportSchema = {
  categoryId: z.uuid().describe("Category ID from list-profound-categories"),
  dates: z
    .object({
      start: z.iso
        .date()
        .describe(
          "Inclusive first day in Profound's Eastern Time reporting calendar"
        ),
      end: z.iso
        .date()
        .describe(
          "Inclusive last day in Profound's Eastern Time reporting calendar"
        ),
    })
    .refine(
      ({ start, end }) => start <= end,
      "The end date must be on or after the start date"
    ),
  scope: z.enum(["owned", "all"]).default("owned"),
  groupBy: z
    .array(z.enum(["date", "model", "topic", "region", "prompt", "persona"]))
    .max(6)
    .default([]),
  interval: z.enum(["day", "week", "month"]).default("day"),
  limit: z.number().int().min(1).max(50).default(10),
  cursor: z
    .string()
    .min(1)
    .optional()
    .describe(
      "info.next_cursor from the previous page; keep other query arguments unchanged"
    ),
};

export function reportBody({
  categoryId,
  dates,
  scope,
  groupBy,
  interval,
  limit,
  cursor,
}: InferSchema<typeof reportSchema>) {
  return {
    category_id: categoryId,
    start_date: dates.start,
    end_date: dates.end,
    scope,
    group_by: groupBy,
    interval,
    limit,
    cursor,
  };
}
