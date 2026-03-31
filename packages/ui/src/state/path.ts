export function getByPath(source: unknown, path: string): unknown {
  if (!path) return source;
  if (source == null || typeof source !== "object") return undefined;

  const parts = path.split(".").filter(Boolean);
  let current: unknown = source;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function setByPath<T extends Record<string, unknown>>(
  source: T,
  path: string,
  value: unknown,
): T {
  if (!path) return source;

  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return source;

  const root: Record<string, unknown> = { ...source };
  let cursor: Record<string, unknown> = root;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const existing = cursor[part];
    const next =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    cursor[part] = next;
    cursor = next;
  }

  cursor[parts[parts.length - 1]] = value;
  return root as T;
}
