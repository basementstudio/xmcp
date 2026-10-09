import type { APIRoute } from "astro";
import { xmcpHandler } from "../../.xmcp/adapter/index.js";

export const prerender = false;
export const ALL: APIRoute = ({ request }) => xmcpHandler(request);
