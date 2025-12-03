export function pascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
    .join("");
}

export function toIdentifier(value: string): string {
  const segments = value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment, index) => {
      if (index === 0) {
        const [first = "", ...rest] = segment;
        return `${first.toLowerCase()}${rest.join("")}`;
      }
      return segment[0].toUpperCase() + segment.slice(1);
    })
    .join("");

  if (!segments) {
    return "tool";
  }

  return /^[0-9]/.test(segments) ? `_${segments}` : segments;
}

export function toFileSafeName(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "client";
}
