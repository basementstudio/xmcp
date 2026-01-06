import { WorkOS } from "@workos-inc/node";
import { getWorkOSClientContext } from "./context.js";

export function getWorkOSClient(): WorkOS {
  const { workos } = getWorkOSClientContext();
  if (!workos) {
    throw new Error(
      "WorkOS client not initialized. Ensure workosProvider() is configured correctly."
    );
  }
  return workos;
}
