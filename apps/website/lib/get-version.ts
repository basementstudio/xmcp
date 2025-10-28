export async function getLatestVersion() {
  try {
    const response = await fetch("https://registry.npmjs.org/xmcp/latest", {
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch version: ${response.status}`);
    }

    const data = await response.json();
    return data.version;
  } catch (error) {
    console.error("Error fetching latest version:", error);
    return "";
  }
}

export const VERSION = await getLatestVersion();
