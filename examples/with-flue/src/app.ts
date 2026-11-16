import { Hono } from "hono";
import { createAgentRouter } from "@flue/runtime/routing";
import { ShippingAssistant } from "./agents/assistant";
import { isBearer, required } from "./env";

const app = new Hono();

app.use("*", async (context, next) => {
  if (!isBearer(context.req.header("authorization"), required("FLUE_TOKEN"))) {
    return context.json({ error: "Unauthorized" }, 401);
  }
  await next();
});
app.route("/agents/shipping", createAgentRouter(ShippingAssistant));

export default app;
