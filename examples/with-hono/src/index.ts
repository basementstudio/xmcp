import { Hono } from "hono";
import mcp from "./routes/mcp";

const app = new Hono();
app.get("/", (c) => c.text("Hono + xmcp. Connect your MCP client to /mcp."));
app.route("/mcp", mcp);
export default app;
