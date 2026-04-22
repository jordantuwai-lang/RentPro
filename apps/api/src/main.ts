import 'dotenv/config'; // ESM-safe dotenv — replaces require('dotenv').config()
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express'; // proper named imports instead of require()

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://fluffy-sniffle-5gw5q66g4rwwc775r-3000.app.github.dev',
      /\.app\.github\.dev$/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,        // auto-transform payloads to DTO class instances
    whitelist: true,        // strip properties not in the DTO
    forbidNonWhitelisted: false, // don't throw on extra props — safe for gradual rollout
  }));

  await app.listen(3001);
}

bootstrap();

