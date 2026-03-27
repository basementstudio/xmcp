import type { ThemeMode, ThemeTokens } from "../react/theme.js";

export type ComponentType =
  | "grid"
  | "card"
  | "table"
  | "stat-card"
  | "text"
  | "input"
  | "textarea"
  | "select"
  | "button"
  | "badge"
  | "separator"
  | "checkbox"
  | "switch"
  | "alert"
  | "loader";

// ── App root ──────────────────────────────────────────────────────────

export interface App {
  title: string;
  description?: string;
  state?: Record<string, unknown>;
  mcpServerUrl: string;
  mcpHeaders?: Array<{ name: string; value: string }>;
  theme?: ThemeMode;
  themeTokens?: Partial<ThemeTokens>;
  root: Component;
}

// ── Component tree ────────────────────────────────────────────────────

export interface Component {
  type: ComponentType;
  id?: string;
  props: Record<string, unknown>;
  children?: Component[];
  actions?: Record<string, Action>;
}

// ── Actions ───────────────────────────────────────────────────────────

export type Action = CallToolAction | SetStateAction;

export interface CallToolAction {
  type: "call-tool";
  tool: string;
  args: Record<string, string>;
  resultKey: string;
}

export interface SetStateAction {
  type: "set-state";
  key: string;
  value: unknown;
}

// ── Component-specific props ──────────────────────────────────────────

export interface GridProps {
  /** @default 2 */
  columns?: number;
  /** @default 16 */
  gap?: number;
  className?: string;
}

export interface CardProps {
  title?: string;
  description?: string;
  /** @default 24 */
  padding?: number;
  className?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

export interface TableProps {
  dataKey: string;
  columns: TableColumn[];
  className?: string;
}

export interface StatCardProps {
  label: string;
  valueKey: string;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down";
  className?: string;
}

export interface TextProps {
  content: string;
  variant?: "h1" | "h2" | "h3" | "body" | "caption";
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  stateKey: string;
  type?: "text" | "number" | "email" | "password";
  className?: string;
}

export interface TextareaProps {
  label?: string;
  placeholder?: string;
  stateKey: string;
  rows?: number;
  className?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  stateKey: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean | string;
  loading?: string;
  className?: string;
}

export interface BadgeProps {
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export interface CheckboxProps {
  label?: string;
  stateKey: string;
  className?: string;
}

export interface SwitchProps {
  label?: string;
  stateKey: string;
  className?: string;
}

export interface AlertProps {
  messageKey: string;
  variant?: "info" | "success" | "warning" | "error";
  dismissible?: boolean;
  className?: string;
}

export interface LoaderProps {
  loadingKey: string;
  label?: string;
  className?: string;
}
