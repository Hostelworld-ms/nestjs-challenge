import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfig } from './app.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Import Swagger
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.enableCors();
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Record API')
    .setDescription('The record management API')
    .build();

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    index: 'index.html',
  });
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(AppConfig.port);
}
bootstrap();
