import { Hono } from "hono";
import { xmcpHandler } from "../../.xmcp/adapter/index.js";

const mcp = new Hono();
mcp.all("/", (c) => xmcpHandler(c.req.raw));
export default mcp;
