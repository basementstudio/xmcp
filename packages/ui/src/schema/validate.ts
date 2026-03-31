import { z } from "zod";
import type { App } from "./types.js";

// ── Actions ───────────────────────────────────────────────────────────

const callToolActionSchema = z.object({
  type: z.literal("call-tool"),
  tool: z.string(),
  args: z.record(z.string(), z.string()),
  resultKey: z.string(),
});

const setStateActionSchema = z.object({
  type: z.literal("set-state"),
  key: z.string(),
  value: z.unknown(),
});

const openLinkActionSchema = z.object({
  type: z.literal("open-link"),
  url: z.string(),
});

const setStateBatchActionSchema = z.object({
  type: z.literal("set-state-batch"),
  entries: z.array(z.object({
    key: z.string(),
    value: z.unknown(),
  })),
});

const actionSchema = z.union([
  callToolActionSchema,
  setStateActionSchema,
  openLinkActionSchema,
  setStateBatchActionSchema,
]);

// ── Component types ───────────────────────────────────────────────────

const componentTypeSchema = z.enum([
  "grid",
  "card",
  "tabs",
  "table",
  "stat-card",
  "text",
  "image",
  "link",
  "input",
  "textarea",
  "select",
  "button",
  "badge",
  "separator",
  "checkbox",
  "switch",
  "alert",
  "loader",
  "progress",
]);

// ── Component-specific prop schemas ───────────────────────────────────

export const gridPropsSchema = z.object({
  columns: z.number().optional().default(2),
  gap: z.number().optional().default(16),
  className: z.string().optional(),
});

export const cardPropsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  padding: z.number().optional().default(24),
  className: z.string().optional(),
});

const tabItemSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const tabsPropsSchema = z.object({
  tabs: z.array(tabItemSchema),
  stateKey: z.string(),
  defaultValue: z.string().optional(),
  className: z.string().optional(),
});

const tableColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  width: z.string().optional(),
});

export const tablePropsSchema = z.object({
  dataKey: z.string(),
  columns: z.array(tableColumnSchema),
  className: z.string().optional(),
});

export const statCardPropsSchema = z.object({
  label: z.string(),
  valueKey: z.string(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  trend: z.enum(["up", "down"]).optional(),
  className: z.string().optional(),
});

export const textPropsSchema = z.object({
  content: z.string(),
  variant: z.enum(["h1", "h2", "h3", "body", "caption"]).optional(),
  className: z.string().optional(),
});

export const inputPropsSchema = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  stateKey: z.string(),
  type: z.enum(["text", "number", "email", "password"]).optional(),
  className: z.string().optional(),
});

export const textareaPropsSchema = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  stateKey: z.string(),
  rows: z.number().optional(),
  className: z.string().optional(),
});

const selectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const selectPropsSchema = z.object({
  label: z.string().optional(),
  stateKey: z.string(),
  options: z.array(selectOptionSchema),
  placeholder: z.string().optional(),
  className: z.string().optional(),
});

export const buttonPropsSchema = z.object({
  label: z.string(),
  variant: z.enum(["primary", "secondary", "danger"]).optional(),
  disabled: z.union([z.boolean(), z.string()]).optional(),
  loading: z.string().optional(),
  className: z.string().optional(),
});

export const badgePropsSchema = z.object({
  label: z.string(),
  variant: z.enum(["default", "secondary", "destructive", "outline"]).optional(),
  className: z.string().optional(),
});

export const separatorPropsSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).optional(),
  className: z.string().optional(),
});

export const checkboxPropsSchema = z.object({
  label: z.string().optional(),
  stateKey: z.string(),
  className: z.string().optional(),
});

export const switchPropsSchema = z.object({
  label: z.string().optional(),
  stateKey: z.string(),
  className: z.string().optional(),
});

export const alertPropsSchema = z.object({
  messageKey: z.string(),
  variant: z.enum(["info", "success", "warning", "error"]).optional(),
  dismissible: z.boolean().optional(),
  className: z.string().optional(),
});

export const loaderPropsSchema = z.object({
  loadingKey: z.string(),
  label: z.string().optional(),
  className: z.string().optional(),
});

export const progressPropsSchema = z.object({
  valueKey: z.string(),
  max: z.number().optional().default(100),
  label: z.string().optional(),
  className: z.string().optional(),
});

export const imagePropsSchema = z.object({
  src: z.string().optional(),
  srcKey: z.string().optional(),
  alt: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  className: z.string().optional(),
});

export const linkPropsSchema = z.object({
  href: z.string(),
  label: z.string(),
  external: z.boolean().optional(),
  className: z.string().optional(),
});

const gridComponentSchema = z.object({
  type: z.literal("grid"),
  id: z.string().optional(),
  props: gridPropsSchema,
  children: z.array(z.lazy(() => componentSchema)).optional(),
});

const cardComponentSchema = z.object({
  type: z.literal("card"),
  id: z.string().optional(),
  props: cardPropsSchema,
  children: z.array(z.lazy(() => componentSchema)).optional(),
});

const tabsComponentSchema = z.object({
  type: z.literal("tabs"),
  id: z.string().optional(),
  props: tabsPropsSchema,
  children: z.array(z.lazy(() => componentSchema)).optional(),
});

const tableComponentSchema = z.object({
  type: z.literal("table"),
  id: z.string().optional(),
  props: tablePropsSchema,
});

const statCardComponentSchema = z.object({
  type: z.literal("stat-card"),
  id: z.string().optional(),
  props: statCardPropsSchema,
});

const textComponentSchema = z.object({
  type: z.literal("text"),
  id: z.string().optional(),
  props: textPropsSchema,
});

const inputComponentSchema = z.object({
  type: z.literal("input"),
  id: z.string().optional(),
  props: inputPropsSchema,
  actions: z.record(z.string(), actionSchema).optional(),
});

const textareaComponentSchema = z.object({
  type: z.literal("textarea"),
  id: z.string().optional(),
  props: textareaPropsSchema,
  actions: z.record(z.string(), actionSchema).optional(),
});

const selectComponentSchema = z.object({
  type: z.literal("select"),
  id: z.string().optional(),
  props: selectPropsSchema,
  actions: z.record(z.string(), actionSchema).optional(),
});

const buttonComponentSchema = z.object({
  type: z.literal("button"),
  id: z.string().optional(),
  props: buttonPropsSchema,
  actions: z.record(z.string(), actionSchema).optional(),
});

const badgeComponentSchema = z.object({
  type: z.literal("badge"),
  id: z.string().optional(),
  props: badgePropsSchema,
});

const separatorComponentSchema = z.object({
  type: z.literal("separator"),
  id: z.string().optional(),
  props: separatorPropsSchema,
});

const checkboxComponentSchema = z.object({
  type: z.literal("checkbox"),
  id: z.string().optional(),
  props: checkboxPropsSchema,
  actions: z.record(z.string(), actionSchema).optional(),
});

const switchComponentSchema = z.object({
  type: z.literal("switch"),
  id: z.string().optional(),
  props: switchPropsSchema,
  actions: z.record(z.string(), actionSchema).optional(),
});

const alertComponentSchema = z.object({
  type: z.literal("alert"),
  id: z.string().optional(),
  props: alertPropsSchema,
});

const loaderComponentSchema = z.object({
  type: z.literal("loader"),
  id: z.string().optional(),
  props: loaderPropsSchema,
});

const progressComponentSchema = z.object({
  type: z.literal("progress"),
  id: z.string().optional(),
  props: progressPropsSchema,
});

const imageComponentSchema = z.object({
  type: z.literal("image"),
  id: z.string().optional(),
  props: imagePropsSchema,
});

const linkComponentSchema = z.object({
  type: z.literal("link"),
  id: z.string().optional(),
  props: linkPropsSchema,
});

const componentSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion("type", [
    gridComponentSchema,
    cardComponentSchema,
    tabsComponentSchema,
    tableComponentSchema,
    statCardComponentSchema,
    textComponentSchema,
    imageComponentSchema,
    linkComponentSchema,
    inputComponentSchema,
    textareaComponentSchema,
    selectComponentSchema,
    buttonComponentSchema,
    badgeComponentSchema,
    separatorComponentSchema,
    checkboxComponentSchema,
    switchComponentSchema,
    alertComponentSchema,
    loaderComponentSchema,
    progressComponentSchema,
  ]),
);

// ── App schema ────────────────────────────────────────────────────────

const appSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  state: z.record(z.string(), z.unknown()).optional(),
  mcpServerUrl: z.string(),
  mcpHeaders: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  theme: z.enum(["dark", "light"]).optional(),
  themeTokens: z
    .object({
      background: z.string().optional(),
      foreground: z.string().optional(),
      card: z.string().optional(),
      cardForeground: z.string().optional(),
      border: z.string().optional(),
      input: z.string().optional(),
      muted: z.string().optional(),
      mutedForeground: z.string().optional(),
      primary: z.string().optional(),
      primaryForeground: z.string().optional(),
      secondary: z.string().optional(),
      secondaryForeground: z.string().optional(),
      destructive: z.string().optional(),
      destructiveForeground: z.string().optional(),
      accent: z.string().optional(),
      accentForeground: z.string().optional(),
      ring: z.string().optional(),
      radius: z.string().optional(),
    })
    .optional(),
  root: componentSchema,
});
// ── Validate ──────────────────────────────────────────────────────────

/**
 * Validates unknown input against the app schema.
 *
 * @param input - The value to validate.
 * @returns A fully typed `App` object.
 * @throws {Error} A descriptive error when validation fails.
 */
export function validateSchema(input: unknown): App {
  const result = appSchema.safeParse(input);

  if (!result.success) {
    const messages = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(
      `Invalid app schema:\n${messages.join("\n")}`,
    );
  }

  return result.data as App;
}

export { appSchema, componentSchema, actionSchema };
