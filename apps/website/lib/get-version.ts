export async function getLatestVersion(): Promise<string> {
  try {
    const response = await fetch("https://registry.npmjs.org/xmcp/latest", {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch version: ${response.status}`);
    }

    const data = await response.json();
    return data.version;
  } catch (error) {
    console.error("Failed to fetch latest version:", error);
    return "";
  }
}
