// Main renderer component
export { App } from "./renderer/App.js";

// DSL builder
export { ui } from "./dsl/index.js";

// Validation helpers
export { validateSchema } from "./schema/validate.js";
export {
  ThemeProvider,
  useTheme,
  createTheme,
  defaultDarkTheme,
  defaultLightTheme,
} from "./react/theme.js";
export type {
  ThemeMode,
  ThemeTokens,
  ThemeDefinition,
} from "./react/theme.js";

// Human-authored React component surface
export {
  AppShell,
  PageHeader,
  PageEyebrow,
  PageTitle,
  PageDescription,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  buttonVariants,
  badgeVariants,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  Badge,
  Separator,
  Checkbox,
  Switch,
  StatCard,
  Alert,
  AlertTitle,
  AlertDescription,
  Loader,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./react/index.js";
export { cn } from "./react/utils.js";

// Types - re-export everything
export type {
  App as AppSchema,
  Component,
  Action,
  CallToolAction,
  SetStateAction,
  ComponentType,
  GridProps,
  CardProps,
  TableProps,
  TableColumn,
  StatCardProps,
  TextProps,
  InputProps,
  TextareaProps,
  SelectProps,
  SelectOption,
  ButtonProps,
  BadgeProps,
  SeparatorProps,
  CheckboxProps,
  SwitchProps,
  AlertProps,
  LoaderProps,
} from "./schema/types.js";

// State hooks (for advanced usage)
export {
  useUiState,
  useUiDispatch,
  useUiLoading,
  useUiError,
} from "./renderer/StateProvider.js";

// Component registry (for extending with custom components)
export { registerComponent, getComponent } from "./components/registry.js";
