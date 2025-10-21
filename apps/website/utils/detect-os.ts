export function detectWindowsFromClient(): boolean {
  if (typeof window === "undefined") return false;

  // @ts-expect-error - userAgentData is not yet widely supported
  const platform = navigator.userAgentData?.platform?.toLowerCase() || "";
  const userAgent = navigator.userAgent?.toLowerCase() || "";

  if (/win/.test(platform)) return true;

  // user agent fallback
  if (/win/.test(userAgent)) return true;

  return false;
}
