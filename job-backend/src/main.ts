// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Connection } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Check database connection
  try {
    const connection = app.get<Connection>(Connection);
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
  
  // Enable CORS for your frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  await app.listen(3002);
}

bootstrap();
