export function getLatestVersion() {
  const version = fetch("https://registry.npmjs.org/xmcp/latest")
    .then((res) => res.json())
    .then((data) => data.version);

  return version;
}

export const VERSION = await getLatestVersion();
