import React from "react";
import type { Component } from "../schema/types.js";
import { getComponent } from "../components/registry.js";

interface ErrorBoundaryProps {
  componentType: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            color: "red",
            padding: 8,
            border: "1px solid red",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          <strong>Error in &lt;{this.props.componentType}&gt;:</strong>{" "}
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary key={child.id ?? index} componentType={child.type}>
      <ComponentRenderer node={child} />
    </ErrorBoundary>
  ));

  return (
    <ErrorBoundary componentType={node.type}>
      <Component
        {...node.props}
        {...(node.actions ? { actions: node.actions } : {})}
      >
        {children}
      </Component>
    </ErrorBoundary>
  );
}

export default ComponentRenderer;
