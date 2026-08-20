import * as React from "react";
import { App } from "../renderer/App.js";
import { createTheme, type ThemeMode, type ThemeTokens } from "../react/theme.js";
import { validateSchema } from "../schema/validate.js";
import type { App as AppSchema } from "../schema/types.js";

export type RenderedPreviewMode = "strict" | "progressive" | "raw";
export type RenderedThemePreset =
  | "zinc"
  | "slate"
  | "stone"
  | "gray"
  | "neutral";

export interface RenderedProps {
  schemaJson?: string;
  className?: string;
  previewMode?: RenderedPreviewMode;
  themeMode?: ThemeMode;
  themePreset?: RenderedThemePreset;
  defaultMcpServerUrl?: string;
  transportMode?: "http" | "host" | "auto";
}

interface RenderSnapshot {
  schema: AppSchema;
  resolvedThemeMode: ThemeMode;
  usePresetTheme: boolean;
}

interface SanitizedRenderSchema {
  schema: AppSchema;
  usePresetTheme: boolean;
}

const DEFAULT_MCP_SERVER_URL = "http://localhost:6274";
const MIN_THEME_CONTRAST_RATIO = 4.5;
const GUARDED_THEME_TOKEN_PAIRS: Array<
  readonly [keyof ThemeTokens, keyof ThemeTokens]
> = [
  ["background", "foreground"],
  ["card", "cardForeground"],
  ["muted", "mutedForeground"],
  ["primary", "primaryForeground"],
  ["secondary", "secondaryForeground"],
];

const renderedThemePresets: Record<
  RenderedThemePreset,
  Record<ThemeMode, ThemeTokens>
> = {
  zinc: {
    light: {
      background: "0 0% 100%",
      foreground: "240 10% 3.9%",
      card: "0 0% 100%",
      cardForeground: "240 10% 3.9%",
      border: "240 5.9% 90%",
      input: "240 5.9% 90%",
      muted: "240 4.8% 95.9%",
      mutedForeground: "240 3.8% 46.1%",
      primary: "240 5.9% 10%",
      primaryForeground: "0 0% 98%",
      secondary: "240 4.8% 95.9%",
      secondaryForeground: "240 5.9% 10%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      accent: "240 4.8% 95.9%",
      accentForeground: "240 5.9% 10%",
      ring: "240 5.9% 10%",
      radius: "0.5rem",
    },
    dark: {
      background: "240 10% 3.9%",
      foreground: "0 0% 98%",
      card: "240 10% 3.9%",
      cardForeground: "0 0% 98%",
      border: "240 3.7% 15.9%",
      input: "240 3.7% 15.9%",
      muted: "240 3.7% 15.9%",
      mutedForeground: "240 5% 64.9%",
      primary: "0 0% 98%",
      primaryForeground: "240 5.9% 10%",
      secondary: "240 3.7% 15.9%",
      secondaryForeground: "0 0% 98%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 0% 98%",
      accent: "240 3.7% 15.9%",
      accentForeground: "0 0% 98%",
      ring: "240 4.9% 83.9%",
      radius: "0.5rem",
    },
  },
  slate: {
    light: {
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "222.2 84% 4.9%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      muted: "210 40% 96.1%",
      mutedForeground: "215.4 16.3% 46.9%",
      primary: "222.2 47.4% 11.2%",
      primaryForeground: "210 40% 98%",
      secondary: "210 40% 96.1%",
      secondaryForeground: "222.2 47.4% 11.2%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "210 40% 98%",
      accent: "210 40% 96.1%",
      accentForeground: "222.2 47.4% 11.2%",
      ring: "222.2 84% 4.9%",
      radius: "0.5rem",
    },
    dark: {
      background: "222.2 84% 4.9%",
      foreground: "210 40% 98%",
      card: "222.2 84% 4.9%",
      cardForeground: "210 40% 98%",
      border: "217.2 32.6% 17.5%",
      input: "217.2 32.6% 17.5%",
      muted: "217.2 32.6% 17.5%",
      mutedForeground: "215 20.2% 65.1%",
      primary: "210 40% 98%",
      primaryForeground: "222.2 47.4% 11.2%",
      secondary: "217.2 32.6% 17.5%",
      secondaryForeground: "210 40% 98%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "210 40% 98%",
      accent: "217.2 32.6% 17.5%",
      accentForeground: "210 40% 98%",
      ring: "212.7 26.8% 83.9%",
      radius: "0.5rem",
    },
  },
  stone: {
    light: {
      background: "0 0% 100%",
      foreground: "25 5.3% 10.7%",
      card: "0 0% 100%",
      cardForeground: "25 5.3% 10.7%",
      border: "20 5.9% 90%",
      input: "20 5.9% 90%",
      muted: "30 4.8% 95.9%",
      mutedForeground: "25 5.3% 44.7%",
      primary: "24 9.8% 10%",
      primaryForeground: "60 9.1% 97.8%",
      secondary: "30 4.8% 95.9%",
      secondaryForeground: "24 9.8% 10%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "60 9.1% 97.8%",
      accent: "30 4.8% 95.9%",
      accentForeground: "24 9.8% 10%",
      ring: "25 5.3% 10.7%",
      radius: "0.5rem",
    },
    dark: {
      background: "20 14.3% 4.1%",
      foreground: "60 9.1% 97.8%",
      card: "20 14.3% 4.1%",
      cardForeground: "60 9.1% 97.8%",
      border: "12 6.5% 15.1%",
      input: "12 6.5% 15.1%",
      muted: "12 6.5% 15.1%",
      mutedForeground: "24 5.4% 63.9%",
      primary: "60 9.1% 97.8%",
      primaryForeground: "24 9.8% 10%",
      secondary: "12 6.5% 15.1%",
      secondaryForeground: "60 9.1% 97.8%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "60 9.1% 97.8%",
      accent: "12 6.5% 15.1%",
      accentForeground: "60 9.1% 97.8%",
      ring: "24 5.7% 82.9%",
      radius: "0.5rem",
    },
  },
  gray: {
    light: {
      background: "0 0% 100%",
      foreground: "224 71.4% 4.1%",
      card: "0 0% 100%",
      cardForeground: "224 71.4% 4.1%",
      border: "220 13% 91%",
      input: "220 13% 91%",
      muted: "220 14.3% 95.9%",
      mutedForeground: "220 8.9% 46.1%",
      primary: "220.9 39.3% 11%",
      primaryForeground: "210 20% 98%",
      secondary: "220 14.3% 95.9%",
      secondaryForeground: "220.9 39.3% 11%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "210 20% 98%",
      accent: "220 14.3% 95.9%",
      accentForeground: "220.9 39.3% 11%",
      ring: "224 71.4% 4.1%",
      radius: "0.5rem",
    },
    dark: {
      background: "224 71.4% 4.1%",
      foreground: "210 20% 98%",
      card: "224 71.4% 4.1%",
      cardForeground: "210 20% 98%",
      border: "215 27.9% 16.9%",
      input: "215 27.9% 16.9%",
      muted: "215 27.9% 16.9%",
      mutedForeground: "217.9 10.6% 64.9%",
      primary: "210 20% 98%",
      primaryForeground: "220.9 39.3% 11%",
      secondary: "215 27.9% 16.9%",
      secondaryForeground: "210 20% 98%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "210 20% 98%",
      accent: "215 27.9% 16.9%",
      accentForeground: "210 20% 98%",
      ring: "216 12.2% 83.9%",
      radius: "0.5rem",
    },
  },
  neutral: {
    light: {
      background: "0 0% 100%",
      foreground: "0 0% 3.9%",
      card: "0 0% 100%",
      cardForeground: "0 0% 3.9%",
      border: "0 0% 89.8%",
      input: "0 0% 89.8%",
      muted: "0 0% 96.1%",
      mutedForeground: "0 0% 45.1%",
      primary: "0 0% 9%",
      primaryForeground: "0 0% 98%",
      secondary: "0 0% 96.1%",
      secondaryForeground: "0 0% 9%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      accent: "0 0% 96.1%",
      accentForeground: "0 0% 9%",
      ring: "0 0% 3.9%",
      radius: "0.5rem",
    },
    dark: {
      background: "0 0% 3.9%",
      foreground: "0 0% 98%",
      card: "0 0% 3.9%",
      cardForeground: "0 0% 98%",
      border: "0 0% 14.9%",
      input: "0 0% 14.9%",
      muted: "0 0% 14.9%",
      mutedForeground: "0 0% 63.9%",
      primary: "0 0% 98%",
      primaryForeground: "0 0% 9%",
      secondary: "0 0% 14.9%",
      secondaryForeground: "0 0% 98%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 0% 98%",
      accent: "0 0% 14.9%",
      accentForeground: "0 0% 98%",
      ring: "0 0% 83.1%",
      radius: "0.5rem",
    },
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(target: T, source: unknown): T {
  if (Array.isArray(target) && Array.isArray(source)) {
    return source as T;
  }

  if (isPlainObject(target) && isPlainObject(source)) {
    const merged: Record<string, unknown> = { ...target };

    for (const [key, value] of Object.entries(source)) {
      const targetValue = merged[key];
      if (Array.isArray(value)) {
        merged[key] = value;
      } else if (isPlainObject(value) && isPlainObject(targetValue)) {
        merged[key] = deepMerge(targetValue, value);
      } else {
        merged[key] = value;
      }
    }

    return merged as T;
  }

  return source as T;
}

function normalizeCssSize(value: unknown): unknown {
  return typeof value === "number" ? `${value}px` : value;
}

function normalizePreviewInput(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(normalizePreviewInput);
  }

  if (!isPlainObject(input)) {
    return input;
  }

  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    normalized[key] = normalizePreviewInput(value);
  }

  if (input.type === "image" && isPlainObject(normalized.props)) {
    normalized.props = {
      ...normalized.props,
      width: normalizeCssSize(normalized.props.width),
      height: normalizeCssSize(normalized.props.height),
    };
  }

  if (input.type === "table" && isPlainObject(normalized.props)) {
    const columns = normalized.props.columns;
    if (Array.isArray(columns)) {
      normalized.props = {
        ...normalized.props,
        columns: columns.map((column) =>
          isPlainObject(column)
            ? { ...column, width: normalizeCssSize(column.width) }
            : column,
        ),
      };
    }
  }

  return normalized;
}

function completeJsonCandidate(input: string) {
  let output = input;
  const stack: string[] = [];
  let inString = false;
  let escaping = false;

  for (const char of input) {
    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }

      if (char === "\\") {
        escaping = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      stack.push("}");
      continue;
    }

    if (char === "[") {
      stack.push("]");
      continue;
    }

    if ((char === "}" || char === "]") && stack[stack.length - 1] === char) {
      stack.pop();
    }
  }

  if (inString) {
    output += '"';
  }

  output = output.replace(/[\s,:]+$/, "");
  output += stack.reverse().join("");
  return output;
}

function tryParseProgressiveJson(input: string): unknown {
  for (let cut = input.length; cut > 0; cut -= 1) {
    const candidate = completeJsonCandidate(input.slice(0, cut));
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
}

function createDefaultJsonApp(
  defaultMcpServerUrl: string = DEFAULT_MCP_SERVER_URL,
  themeMode: ThemeMode = "light",
): AppSchema {
  return {
    title: "Preview",
    mcpServerUrl: defaultMcpServerUrl,
    theme: themeMode,
    state: {},
    root: {
      type: "grid",
      props: { columns: 1, gap: 0 },
      children: [],
    },
  };
}

function resolveThemeMode(
  input: unknown,
  themeMode: ThemeMode = "light",
): ThemeMode {
  if (isPlainObject(input) && (input.theme === "light" || input.theme === "dark")) {
    return input.theme;
  }

  return themeMode;
}

function applyThemeMode(input: unknown, themeMode: ThemeMode): unknown {
  if (!isPlainObject(input)) {
    return input;
  }

  return { ...input, theme: themeMode };
}

function usesInlineThemeTokens(input: unknown): boolean {
  return isPlainObject(input) && isPlainObject(input.themeTokens);
}

function parseHslToken(
  token: string,
): { h: number; s: number; l: number } | null {
  const parts = token.trim().split(/\s+/);
  if (parts.length < 3) {
    return null;
  }

  const [hueRaw, saturationRaw, lightnessRaw] = parts;
  const hue = Number.parseFloat(hueRaw);
  const saturation = Number.parseFloat(saturationRaw.replace("%", ""));
  const lightness = Number.parseFloat(lightnessRaw.replace("%", ""));

  if (
    !Number.isFinite(hue) ||
    !Number.isFinite(saturation) ||
    !Number.isFinite(lightness)
  ) {
    return null;
  }

  return { h: hue, s: saturation / 100, l: lightness / 100 };
}

function hueToRgb(p: number, q: number, t: number): number {
  let wrapped = t;

  if (wrapped < 0) {
    wrapped += 1;
  }

  if (wrapped > 1) {
    wrapped -= 1;
  }

  if (wrapped < 1 / 6) {
    return p + (q - p) * 6 * wrapped;
  }

  if (wrapped < 1 / 2) {
    return q;
  }

  if (wrapped < 2 / 3) {
    return p + (q - p) * (2 / 3 - wrapped) * 6;
  }

  return p;
}

function hslToRgb(token: string): [number, number, number] | null {
  const parsed = parseHslToken(token);
  if (!parsed) {
    return null;
  }

  const hue = ((parsed.h % 360) + 360) % 360 / 360;

  if (parsed.s === 0) {
    return [parsed.l, parsed.l, parsed.l];
  }

  const q =
    parsed.l < 0.5
      ? parsed.l * (1 + parsed.s)
      : parsed.l + parsed.s - parsed.l * parsed.s;
  const p = 2 * parsed.l - q;

  return [
    hueToRgb(p, q, hue + 1 / 3),
    hueToRgb(p, q, hue),
    hueToRgb(p, q, hue - 1 / 3),
  ];
}

function relativeLuminance(token: string): number | null {
  const rgb = hslToRgb(token);
  if (!rgb) {
    return null;
  }

  const [r, g, b] = rgb.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(background: string, foreground: string): number | null {
  const backgroundLuminance = relativeLuminance(background);
  const foregroundLuminance = relativeLuminance(foreground);

  if (
    backgroundLuminance === null ||
    foregroundLuminance === null
  ) {
    return null;
  }

  const lighter = Math.max(backgroundLuminance, foregroundLuminance);
  const darker = Math.min(backgroundLuminance, foregroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function hasAccessibleInlineThemeTokens(
  themeTokens: Partial<ThemeTokens>,
  themeMode: ThemeMode,
): boolean {
  const resolvedTokens = createTheme(themeMode, themeTokens).tokens;

  for (const [backgroundKey, foregroundKey] of GUARDED_THEME_TOKEN_PAIRS) {
    const ratio = contrastRatio(
      resolvedTokens[backgroundKey],
      resolvedTokens[foregroundKey],
    );

    if (ratio === null || ratio < MIN_THEME_CONTRAST_RATIO) {
      return false;
    }
  }

  return true;
}

function sanitizeRenderableSchema(
  schema: AppSchema,
  resolvedThemeMode: ThemeMode,
): SanitizedRenderSchema {
  if (
    !schema.themeTokens ||
    hasAccessibleInlineThemeTokens(schema.themeTokens, resolvedThemeMode)
  ) {
    return {
      schema,
      usePresetTheme: !schema.themeTokens,
    };
  }

  return {
    schema: {
      ...schema,
      themeTokens: undefined,
    },
    usePresetTheme: true,
  };
}

function tryBuildPreviewSchema(
  parsedInput: unknown,
  defaultMcpServerUrl: string,
  themeMode: ThemeMode,
): AppSchema | null {
  if (!isPlainObject(parsedInput)) {
    return null;
  }

  const root = parsedInput.root;
  if (!isPlainObject(root) || typeof root.type !== "string") {
    return null;
  }

  const hasUserStructure =
    Array.isArray(root.children) && root.children.length > 0;

  if (!hasUserStructure) {
    return null;
  }

  try {
    return validateSchema(
      deepMerge(createDefaultJsonApp(defaultMcpServerUrl, themeMode), parsedInput),
    );
  } catch {
    return null;
  }
}

function renderErrorState(title: string, body: string, details?: string) {
  return (
    <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-8 shadow-2xl shadow-red-950/20">
      <p className="mb-2 text-sm uppercase tracking-[0.18em] text-red-300">
        JSON Renderer Error
      </p>
      <h1 className="mb-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mb-6 text-sm leading-6 text-slate-300">{body}</p>
      {details ? (
        <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-200">
          {details}
        </pre>
      ) : null}
    </div>
  );
}

function renderLoading() {
  return (
    <div className="flex min-h-[28rem] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 font-sans text-slate-100">
      <div className="flex flex-col items-center gap-4">
        <svg
          className="h-8 w-8 animate-spin text-cyan-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm text-slate-400">Building your UI...</p>
      </div>
    </div>
  );
}

function renderRawState(schemaJson: string) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-100">Raw stream</p>
          <p className="text-xs text-slate-400">
            Showing the incoming schema text exactly as received.
          </p>
        </div>
        <span className="rounded-full border border-cyan-800/70 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-200">
          {schemaJson.length} chars
        </span>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-200">
        {schemaJson}
      </pre>
    </div>
  );
}

function renderFrame(
  children: React.ReactNode,
  themeStyle?: React.CSSProperties,
) {
  return (
    <div className="bg-transparent p-0 font-sans text-inherit" style={themeStyle}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}

function renderSchemaPreview(
  schema: AppSchema,
  resolvedThemeMode: ThemeMode,
  themePreset: RenderedThemePreset,
  className?: string,
  transportMode: RenderedProps["transportMode"] = "http",
) {
  const sanitized = sanitizeRenderableSchema(schema, resolvedThemeMode);

  return {
    snapshot: {
      schema: sanitized.schema,
      resolvedThemeMode,
      usePresetTheme: sanitized.usePresetTheme,
    } satisfies RenderSnapshot,
    element: renderFrame(
      <App
        schema={sanitized.schema}
        className={className ?? "mx-auto max-w-6xl min-h-0 p-0 m-0"}
        inheritTheme={sanitized.usePresetTheme}
        transportMode={transportMode}
      />,
      sanitized.usePresetTheme
        ? createTheme(
            resolvedThemeMode,
            renderedThemePresets[themePreset][resolvedThemeMode],
          ).style
        : undefined,
    ),
  };
}

export function Rendered({
  schemaJson,
  className,
  previewMode = "progressive",
  themeMode = "light",
  themePreset = "zinc",
  defaultMcpServerUrl = DEFAULT_MCP_SERVER_URL,
  transportMode = "http",
}: RenderedProps) {
  const lastGoodSnapshotRef = React.useRef<RenderSnapshot | null>(null);
  const trimmedSchemaJson = schemaJson?.trim() ?? "";

  let parsedInput: unknown;
  let parseError = false;

  if (trimmedSchemaJson) {
    try {
      parsedInput = JSON.parse(trimmedSchemaJson);
    } catch {
      parseError = true;
    }
  }

  const resolvedThemeMode = resolveThemeMode(parsedInput, themeMode);
  const normalizedParsedInput =
    parsedInput !== undefined
      ? normalizePreviewInput(applyThemeMode(parsedInput, resolvedThemeMode))
      : parsedInput;

  let validatedSchema: AppSchema | null = null;
  let validationMessage: string | null = null;

  if (!parseError && normalizedParsedInput !== undefined) {
    try {
      validatedSchema = validateSchema(normalizedParsedInput);
    } catch (error) {
      validationMessage =
        error instanceof Error ? error.message : String(error);
    }
  }

  const repairedPartialInput =
    trimmedSchemaJson && !validatedSchema
      ? tryParseProgressiveJson(trimmedSchemaJson)
      : normalizedParsedInput;
  const progressiveSchema = tryBuildPreviewSchema(
    applyThemeMode(repairedPartialInput, resolvedThemeMode),
    defaultMcpServerUrl,
    resolvedThemeMode,
  );

  if (previewMode === "raw") {
    return renderFrame(
      trimmedSchemaJson ? renderRawState(trimmedSchemaJson) : renderLoading(),
    );
  }

  if (!trimmedSchemaJson) {
    lastGoodSnapshotRef.current = null;
    return renderFrame(renderLoading());
  }

  if (validatedSchema) {
    const preview = renderSchemaPreview(
      validatedSchema,
      resolvedThemeMode,
      themePreset,
      className,
      transportMode,
    );
    lastGoodSnapshotRef.current = preview.snapshot;
    return preview.element;
  }

  if (previewMode === "progressive" && progressiveSchema) {
    const preview = renderSchemaPreview(
      progressiveSchema,
      resolvedThemeMode,
      themePreset,
      className,
      transportMode,
    );
    lastGoodSnapshotRef.current = preview.snapshot;
    return preview.element;
  }

  if (previewMode === "progressive" && lastGoodSnapshotRef.current) {
    const snapshot = lastGoodSnapshotRef.current;
    return renderFrame(
      <App
        schema={snapshot.schema}
        className={className ?? "mx-auto max-w-6xl min-h-0 p-0 m-0"}
        inheritTheme={snapshot.usePresetTheme}
        transportMode={transportMode}
      />,
      snapshot.usePresetTheme
        ? createTheme(
            snapshot.resolvedThemeMode,
            renderedThemePresets[themePreset][snapshot.resolvedThemeMode],
          ).style
        : undefined,
    );
  }

  if (parseError) {
    return renderFrame(
      previewMode === "progressive"
        ? renderLoading()
        : renderErrorState(
            "Invalid JSON",
            "The incoming value is not valid JSON yet.",
          ),
    );
  }

  return renderFrame(
    renderErrorState(
      "Invalid App Schema",
      "The JSON parsed successfully, but it did not match the @xmcp-dev/ui app schema contract. The most common missing fields are mcpServerUrl and root.",
      validationMessage ?? undefined,
    ),
  );
}
