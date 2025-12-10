import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS para permitir requisições do frontend
  // Accepts a single origin or a comma-separated list in FRONTEND_URL
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowAll = process.env.FRONTEND_ALLOW_ALL_ORIGINS === 'true';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowAll) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // For debugging, return detailed message for allowed failure
      const msg = `CORS for origin '${origin}' is not allowed. Allowed: ${allowedOrigins.join(', ')}`;
      console.warn('[CORS] Denied origin:', origin);
      return callback(null, false);
    },
    credentials: true,
  });


  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configurar prefixo global da API
  app.setGlobalPrefix('api/v1');

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Elisha API')
    .setDescription('API para gerenciamento do sistema Elisha')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Swagger agora acessível em /api/v1/docs
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Elisha API está rodando em: http://localhost:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api/v1/docs`);
}
bootstrap();