export function detectMacFromClient(): boolean {
  if (typeof window === "undefined") return false;

  // @ts-expect-error - userAgentData is not yet widely supported
  const platform = navigator.userAgentData?.platform?.toLowerCase() || "";
  const userAgent = navigator.userAgent?.toLowerCase() || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  if (/mac/.test(platform)) return true;

  // user agent fallback
  if (/(mac|iphone|ipad|ipod)/.test(userAgent)) return true;

  // iPad with Safari 13+ reports as Mac in user agent
  if (maxTouchPoints > 0 && /mac/.test(userAgent)) return true;

  return false;
}
