import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`MCP endpoint (protected): http://localhost:${port}/mcp`);
  logger.log(`\nTo test with authentication, use:`);
  logger.log(`  Authorization: Bearer <your-token>`);
}

bootstrap();
