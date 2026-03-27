import type { ComponentType } from "../schema/types.js";
import type { ComponentType as ReactComponentType } from "react";

const registry = new Map<ComponentType, ReactComponentType<any>>();

export function registerComponent(type: ComponentType, component: ReactComponentType<any>) {
  registry.set(type, component);
}

export function getComponent(type: ComponentType): ReactComponentType<any> | undefined {
  return registry.get(type);
}

// ── Register all components ──────────────────────────────────────────

import { Grid } from "./layout/Grid.js";
import { Card } from "./layout/Card.js";
import { Separator } from "./layout/Separator.js";
import { Table } from "./data/Table.js";
import { StatCard } from "./data/StatCard.js";
import { Text } from "./data/Text.js";
import { Badge } from "./data/Badge.js";
import { Input } from "./forms/Input.js";
import { Textarea } from "./forms/Textarea.js";
import { Select } from "./forms/Select.js";
import { Button } from "./forms/Button.js";
import { Checkbox } from "./forms/Checkbox.js";
import { Switch } from "./forms/Switch.js";
import { Alert } from "./feedback/Alert.js";
import { Loader } from "./feedback/Loader.js";

registerComponent("grid", Grid);
registerComponent("card", Card);
registerComponent("separator", Separator);
registerComponent("table", Table);
registerComponent("stat-card", StatCard);
registerComponent("text", Text);
registerComponent("badge", Badge);
registerComponent("input", Input);
registerComponent("textarea", Textarea);
registerComponent("select", Select);
registerComponent("button", Button);
registerComponent("checkbox", Checkbox);
registerComponent("switch", Switch);
registerComponent("alert", Alert);
registerComponent("loader", Loader);

export { registry };
