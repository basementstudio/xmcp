import { toolRegistry } from "@xmcp/tools";

export async function GET() {
  const response = await toolRegistry();
  return Response.json(response);
}
