import Fastify from "fastify";
import { xmcpHandler } from "@xmcp/adapter";

const app = Fastify({ logger: false });
const port = 3000;

app.post("/mcp", xmcpHandler);
app.get("/mcp", xmcpHandler);

app.listen({ port }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});

export default app;
