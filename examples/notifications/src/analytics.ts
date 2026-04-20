const eventCounts = new Map<string, number>();

export function track(name: string, properties?: Record<string, unknown>) {
  const count = (eventCounts.get(name) ?? 0) + 1;
  eventCounts.set(name, count);
  console.log(
    `[analytics] "${name}" (count=${count})`,
    properties ?? {}
  );
  return count;
}
