import { createServer } from "node:http";

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:3002");
  const match = /^\/api\/pets\/([^/]+)$/.exec(url.pathname);
  if (!["GET", "PUT"].includes(request.method) || !match) {
    response.writeHead(404).end("Not found");
    return;
  }
  if (request.method === "PUT") {
    if (
      !process.env.PET_API_AUTH ||
      request.headers.authorization !== process.env.PET_API_AUTH
    ) {
      response.writeHead(401).end("Unauthorized");
      return;
    }
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          id: decodeURIComponent(match[1]),
          ...body,
          label: request.headers["x-request-label"],
        })
      );
    } catch {
      response.writeHead(400).end("Invalid JSON");
    }
    return;
  }
  response.setHeader("Content-Type", "application/json");
  response.end(
    JSON.stringify({
      id: decodeURIComponent(match[1]),
      name: "Mochi",
      ...(url.searchParams.get("verbose") === "true" ? { species: "cat" } : {}),
    })
  );
});

server.listen(3002, "127.0.0.1", () => {
  console.log("Example API: http://127.0.0.1:3002/api");
});
