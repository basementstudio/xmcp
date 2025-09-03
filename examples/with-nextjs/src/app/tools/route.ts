import { generateResponse } from "../utils/greet-user";

export async function GET() {
  const response = await generateResponse();

  console.log(response);

  return Response.json(response);
}
