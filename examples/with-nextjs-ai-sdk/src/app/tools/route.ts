import { toolRegistry } from "@xmcp/tools";

export async function GET() {
  const response = await toolRegistry();

  console.log(response);

  return Response.json(response);
}
