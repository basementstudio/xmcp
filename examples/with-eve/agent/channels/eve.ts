import { eveChannel } from "eve/channels/eve";
import { isBearer, required } from "../../src/env";

export default eveChannel({
  auth: async (request) => {
    if (
      !isBearer(request.headers.get("authorization"), required("EVE_TOKEN"))
    ) {
      return null;
    }
    return {
      attributes: {},
      authenticator: "xmcp-example",
      principalId: "xmcp",
      principalType: "app",
    };
  },
});
