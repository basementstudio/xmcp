import type { ComponentType } from "../schema/types.js";
import type { ComponentType as ReactComponentType } from "react";

const registry = new Map<ComponentType, ReactComponentType<Record<string, unknown>>>();

export function registerComponent(type: ComponentType, component: ReactComponentType<Record<string, unknown>>) {
  registry.set(type, component);
}

export function getComponent(type: ComponentType): ReactComponentType<Record<string, unknown>> | undefined {
  return registry.get(type);
}

// ── Register all components ──────────────────────────────────────────

import { Grid } from "./layout/Grid.js";
import { Card } from "./layout/Card.js";
import { Tabs } from "./layout/Tabs.js";
import { Separator } from "./layout/Separator.js";
import { Table } from "./data/Table.js";
import { StatCard } from "./data/StatCard.js";
import { Text } from "./data/Text.js";
import { Badge } from "./data/Badge.js";
import { Image } from "./data/Image.js";
import { Link } from "./data/Link.js";
import { Input } from "./forms/Input.js";
import { Textarea } from "./forms/Textarea.js";
import { Select } from "./forms/Select.js";
import { Button } from "./forms/Button.js";
import { Checkbox } from "./forms/Checkbox.js";
import { Switch } from "./forms/Switch.js";
import { Alert } from "./feedback/Alert.js";
import { Loader } from "./feedback/Loader.js";
import { Progress } from "./feedback/Progress.js";

const r = (type: ComponentType, c: ReactComponentType<never>) =>
  registerComponent(type, c as ReactComponentType<Record<string, unknown>>);

r("grid", Grid);
r("card", Card);
r("tabs", Tabs);
r("separator", Separator);
r("table", Table);
r("stat-card", StatCard);
r("text", Text);
r("badge", Badge);
r("image", Image);
r("link", Link);
r("input", Input);
r("textarea", Textarea);
r("select", Select);
r("button", Button);
r("checkbox", Checkbox);
r("switch", Switch);
r("alert", Alert);
r("loader", Loader);
r("progress", Progress);

export { registry };
