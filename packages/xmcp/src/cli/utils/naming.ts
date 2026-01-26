export function pascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
    .join("");
}

export function toCamelCase(value: string): string {
  // First, split camelCase/PascalCase into words, then handle kebab/snake case
  const normalized = value.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

  const segments = normalized
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment, index) => {
      if (index === 0) {
        return segment.toLowerCase();
      }
      return segment[0].toUpperCase() + segment.slice(1).toLowerCase();
    })
    .join("");

  if (!segments) {
    return "item";
  }

  return /^[0-9]/.test(segments) ? `_${segments}` : segments;
}

export function toKebabCase(value: string): string {
  return (
    value
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "item"
  );
}
