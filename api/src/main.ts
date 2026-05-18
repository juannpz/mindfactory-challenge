import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Valida DTOs con class-validator: whitelist + forbidNonWhitelisted + transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Convierte errores de constraints de PostgreSQL (23505, 23503) en 422
  app.useGlobalFilters(new TypeOrmExceptionFilter());

  // Swagger/OpenAPI disponible en /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MindFactory Auto Registry API')
    .setDescription(
      'API REST para gestión de registro de automotores y dueños.\n\n' +
        '**Dominio:** formato AAA999 o AA999AA\n' +
        '**CUIT:** 11 dígitos con dígito verificador módulo 11\n' +
        '**Fecha fabricación:** YYYYMM, no futura',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Swagger docs on http://localhost:${port}/api/docs`);
}

bootstrap();
