import { createServer } from "node:http";

const server = createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:3002");
  const match = /^\/api\/pets\/([^/]+)$/.exec(url.pathname);
  if (request.method !== "GET" || !match) {
    response.writeHead(404).end("Not found");
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
