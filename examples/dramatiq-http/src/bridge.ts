import { createDramatiqClient } from "@xmcp-dev/dramatiq";
import { required } from "./env";

export function bridge() {
  return createDramatiqClient({
    baseUrl: required("DRAMATIQ_BRIDGE_URL"),
    token: required("DRAMATIQ_BRIDGE_TOKEN"),
  });
}
