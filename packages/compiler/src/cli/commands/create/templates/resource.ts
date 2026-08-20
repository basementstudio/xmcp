import { pascalCase, toCamelCase, toKebabCase } from "../../../utils/naming";

export function generateResourceTemplate(name: string): string {
  const functionName = toCamelCase(name);
  const kebabName = toKebabCase(name);

  return `import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "${kebabName}",
  title: "${pascalCase(name)}",
  description: "TODO: Add description",
};

export default function ${functionName}() {
  // TODO: Implement your resource logic here
  return "Resource data for ${name}";
}
`;
}
