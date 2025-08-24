import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('NestJS application is running on: http://localhost:3000');
  console.log('XMCP endpoint is available at: http://localhost:3000/mcp');
}
bootstrap();
