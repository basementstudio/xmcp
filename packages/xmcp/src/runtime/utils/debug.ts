export const isDebugEnabled = (): boolean =>
  process.env.XMCP_DEBUG === "1" || process.env.XMCP_DEBUG === "true";

export function debugWarn(msg: string): void {
  if (isDebugEnabled()) console.warn(msg);
}
