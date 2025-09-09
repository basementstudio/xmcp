import { tools } from "@xmcp/tools";

export async function GET() {
  console.log(tools);

  return Response.json(tools);
}
