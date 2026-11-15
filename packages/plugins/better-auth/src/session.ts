import { getBetterAuthContext } from "./context.js";
import { BetterAuthSession } from "./types.js";

export async function getBetterAuthSession(): Promise<BetterAuthSession> {
  const { session } = getBetterAuthContext();

  if (!session) {
    throw new Error(
      "getBetterAuthSession must be used within a betterAuthProvider"
    );
  }

  return session;
}
