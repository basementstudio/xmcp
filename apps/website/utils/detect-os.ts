import { headers } from "next/headers";

export async function detectMacFromHeaders(): Promise<boolean> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  return /(Mac|iPhone|iPod|iPad)/i.test(userAgent);
}
