import type { RequestHandler } from "./$types";
import { xmcpHandler } from "../../../.xmcp/adapter/index.js";

export const GET: RequestHandler = ({ request }) => xmcpHandler(request);
export const POST: RequestHandler = ({ request }) => xmcpHandler(request);
export const DELETE: RequestHandler = ({ request }) => xmcpHandler(request);
