import { createHttpTransport } from "./create-transport";

async function main() {
  const transport = await createHttpTransport();

  await transport.start();
}

main();
