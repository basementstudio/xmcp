import type {
  App,
  Component,
  Action,
  CallToolAction,
  SetStateAction,
  OpenLinkAction,
  SetStateBatchAction,
  GridProps,
  CardProps,
  TabsProps,
  TableProps,
  StatCardProps,
  TextProps,
  ImageProps,
  LinkProps,
  InputProps,
  TextareaProps,
  SelectProps,
  ButtonProps,
  BadgeProps,
  SeparatorProps,
  CheckboxProps,
  SwitchProps,
  AlertProps,
  LoaderProps,
  ProgressProps,
  ComponentType,
  PropsMap,
} from "../schema/types.js";
import { validateSchema } from "../schema/validate.js";

// Helper types for DSL (adds action shorthands)
interface ButtonDSLProps extends ButtonProps {
  onClick?: Action;
}

interface InputDSLProps extends InputProps {
  onChange?: Action;
}

interface TextareaDSLProps extends TextareaProps {
  onChange?: Action;
}

interface SelectDSLProps extends SelectProps {
  onChange?: Action;
}

interface CheckboxDSLProps extends CheckboxProps {
  onChange?: Action;
}

interface SwitchDSLProps extends SwitchProps {
  onChange?: Action;
}

function makeComponent<T extends ComponentType>(
  type: T,
  props: PropsMap[T],
  children?: Component[]
): Component {
  const component: Component = { type, props: props as Record<string, unknown> };
  if (children && children.length > 0) {
    component.children = children;
  }
  return component;
}

export const ui = {
  app(config: App): App {
    return config;
  },

  // Layout components accept props + children
  grid(props: GridProps, ...children: Component[]): Component {
    return makeComponent("grid", props, children);
  },

  card(props: CardProps, ...children: Component[]): Component {
    return makeComponent("card", props, children);
  },

  tabs(props: TabsProps, ...children: Component[]): Component {
    return makeComponent("tabs", props, children);
  },

  // Data components (no children)
  table(props: TableProps): Component {
    return makeComponent("table", props);
  },

  statCard(props: StatCardProps): Component {
    return makeComponent("stat-card", props);
  },

  text(props: TextProps): Component {
    return makeComponent("text", props);
  },

  image(props: ImageProps): Component {
    return makeComponent("image", props);
  },

  link(props: LinkProps): Component {
    return makeComponent("link", props);
  },

  // Form components
  input(props: InputDSLProps): Component {
    const { onChange, ...rest } = props;
    const component = makeComponent("input", rest);
    if (onChange) {
      component.actions = { onChange };
    }
    return component;
  },

  textarea(props: TextareaDSLProps): Component {
    const { onChange, ...rest } = props;
    const component = makeComponent("textarea", rest);
    if (onChange) {
      component.actions = { onChange };
    }
    return component;
  },

  select(props: SelectDSLProps): Component {
    const { onChange, ...rest } = props;
    const component = makeComponent("select", rest);
    if (onChange) {
      component.actions = { onChange };
    }
    return component;
  },

  button(props: ButtonDSLProps): Component {
    const { onClick, ...rest } = props;
    const component = makeComponent("button", rest);
    if (onClick) {
      component.actions = { onClick };
    }
    return component;
  },

  badge(props: BadgeProps): Component {
    return makeComponent("badge", props);
  },

  separator(props: SeparatorProps = {}): Component {
    return makeComponent("separator", props);
  },

  checkbox(props: CheckboxDSLProps): Component {
    const { onChange, ...rest } = props;
    const component = makeComponent("checkbox", rest);
    if (onChange) {
      component.actions = { onChange };
    }
    return component;
  },

  switch(props: SwitchDSLProps): Component {
    const { onChange, ...rest } = props;
    const component = makeComponent("switch", rest);
    if (onChange) {
      component.actions = { onChange };
    }
    return component;
  },

  // Feedback components
  alert(props: AlertProps): Component {
    return makeComponent("alert", props);
  },

  loader(props: LoaderProps): Component {
    return makeComponent("loader", props);
  },

  progress(props: ProgressProps): Component {
    return makeComponent("progress", props);
  },

  // Action helpers
  callTool(
    tool: string,
    args: Record<string, string>,
    resultKey: string
  ): CallToolAction {
    return { type: "call-tool", tool, args, resultKey };
  },

  setState(key: string, value: unknown): SetStateAction {
    return { type: "set-state", key, value };
  },

  openLink(url: string): OpenLinkAction {
    return { type: "open-link", url };
  },

  setStateBatch(entries: Array<{ key: string; value: unknown }>): SetStateBatchAction {
    return { type: "set-state-batch", entries };
  },

  validate(input: unknown): { success: true; data: App } | { success: false; errors: string[] } {
    try {
      const data = validateSchema(input);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const errors = message.includes('\n')
        ? message.split('\n').slice(1).map(l => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean)
        : [message];
      return { success: false, errors };
    }
  },
};
