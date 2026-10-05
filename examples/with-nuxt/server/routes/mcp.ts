import { xmcpHandler } from "../../.xmcp/adapter/index.js";

export default defineEventHandler((event) => xmcpHandler(toWebRequest(event)));
