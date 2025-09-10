import { tools } from "@xmcp/tools";

export async function GET() {
  return Response.json(tools);
}
