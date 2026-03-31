import React from "react";
import type { Component } from "../schema/types.js";
import { getComponent } from "../components/registry.js";

export interface ComponentRendererProps {
  node: Component;
}

export function ComponentRenderer({ node }: ComponentRendererProps) {
  const Component = getComponent(node.type);

  if (!Component) {
    return (
      <div style={{ color: "red", padding: 8, border: "1px solid red", borderRadius: 4 }}>
        Unknown component type: {node.type}
      </div>
    );
  }

  const children = node.children?.map((child, index) => (
    <ComponentRenderer key={child.id ?? index} node={child} />
  ));

  return (
    <Component
      {...node.props}
      {...(node.actions ? { actions: node.actions } : {})}
    >
      {children}
    </Component>
  );
}

export default ComponentRenderer;
