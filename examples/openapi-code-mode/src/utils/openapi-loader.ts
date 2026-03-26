let cachedSpec: string | null = null;

/**
 * Fetch an OpenAPI spec from a URL and cache it in memory.
 * Returns the raw JSON string (agent parses in sandbox).
 */
export async function loadSpec(url: string): Promise<string> {
  if (cachedSpec) return cachedSpec;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to load OpenAPI spec from ${url}: ${res.status} ${res.statusText}`
    );
  }

  cachedSpec = await res.text();
  return cachedSpec;
}
