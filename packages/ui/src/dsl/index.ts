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
} from "../schema/types.js";

// Helper type for button DSL (adds onClick shorthand)
interface ButtonDSLProps extends ButtonProps {
  onClick?: Action;
}

function makeComponent(
  type: ComponentType,
  props: Record<string, unknown>,
  children?: Component[]
): Component {
  const component: Component = { type, props };
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
    return makeComponent("grid", props as unknown as Record<string, unknown>, children);
  },

  card(props: CardProps, ...children: Component[]): Component {
    return makeComponent("card", props as unknown as Record<string, unknown>, children);
  },

  tabs(props: TabsProps, ...children: Component[]): Component {
    return makeComponent("tabs", props as unknown as Record<string, unknown>, children);
  },

  // Data components (no children)
  table(props: TableProps): Component {
    return makeComponent("table", props as unknown as Record<string, unknown>);
  },

  statCard(props: StatCardProps): Component {
    return makeComponent("stat-card", props as unknown as Record<string, unknown>);
  },

  text(props: TextProps): Component {
    return makeComponent("text", props as unknown as Record<string, unknown>);
  },

  image(props: ImageProps): Component {
    return makeComponent("image", props as unknown as Record<string, unknown>);
  },

  link(props: LinkProps): Component {
    return makeComponent("link", props as unknown as Record<string, unknown>);
  },

  // Form components
  input(props: InputProps): Component {
    return makeComponent("input", props as unknown as Record<string, unknown>);
  },

  textarea(props: TextareaProps): Component {
    return makeComponent("textarea", props as unknown as Record<string, unknown>);
  },

  select(props: SelectProps): Component {
    return makeComponent("select", props as unknown as Record<string, unknown>);
  },

  button(props: ButtonDSLProps): Component {
    const { onClick, ...rest } = props;
    const component = makeComponent("button", rest as unknown as Record<string, unknown>);
    if (onClick) {
      component.actions = { onClick };
    }
    return component;
  },

  badge(props: BadgeProps): Component {
    return makeComponent("badge", props as unknown as Record<string, unknown>);
  },

  separator(props: SeparatorProps = {}): Component {
    return makeComponent("separator", props as unknown as Record<string, unknown>);
  },

  checkbox(props: CheckboxProps): Component {
    return makeComponent("checkbox", props as unknown as Record<string, unknown>);
  },

  switch(props: SwitchProps): Component {
    return makeComponent("switch", props as unknown as Record<string, unknown>);
  },

  // Feedback components
  alert(props: AlertProps): Component {
    return makeComponent("alert", props as unknown as Record<string, unknown>);
  },

  loader(props: LoaderProps): Component {
    return makeComponent("loader", props as unknown as Record<string, unknown>);
  },

  progress(props: ProgressProps): Component {
    return makeComponent("progress", props as unknown as Record<string, unknown>);
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
};
