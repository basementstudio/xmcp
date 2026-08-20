import { getSessionContext } from "./context.js";
import type { Session } from "./types.js";

export function getSession(): Session {
  const context = getSessionContext();

  if (!context.session) {
    throw new Error(
      "[Scalekit] Session not initialized. " +
        "Ensure this is called within a protected route that passed authentication."
    );
  }

  return context.session;
}