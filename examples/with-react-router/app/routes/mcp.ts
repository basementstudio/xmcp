import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { xmcpHandler } from "../../.xmcp/adapter/index.js";

export function loader({ request }: LoaderFunctionArgs) {
  return xmcpHandler(request);
}

export function action({ request }: ActionFunctionArgs) {
  return xmcpHandler(request);
}
