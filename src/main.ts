import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppFactory } from './AppFactory';

async function bootstrap() {
  let app;
  if (process.env.NODE_ENV === 'production') {
    const { appPromise } = AppFactory.create();
    app = await appPromise;
  }else{
    app = await NestFactory.create(AppModule);
  }
  
    // Configuration CORS
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3001);
  
}
bootstrap();
