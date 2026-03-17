import { pascalCase, toCamelCase, toKebabCase } from "../../../utils/naming";

export function generateWidgetTemplate(name: string): string {
  const functionName = toCamelCase(name);
  const kebabName = toKebabCase(name);

  return `import { type ToolMetadata } from "xmcp";
import { useState } from "react";

export const metadata: ToolMetadata = {
  name: "${kebabName}",
  description: "${pascalCase(name)} Widget",
  _meta: {
    ui: {
      csp: {
        connectDomains: [],
      },
    },
  },
};

export default function ${functionName}() {
  const [state, setState] = useState<string | null>(null);

  return (
    <div>
      <h1>${pascalCase(name)}</h1>
      <p>TODO: Implement your widget UI here</p>
    </div>
  );
}
`;
}
