import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { ZodExceptionFilter } from './shared/filters/zod-exception-filter';
import { PrismaExceptionFilter } from './shared/filters/prisma-exception-filter';
import { AllExceptionsFilter } from './shared/filters/all-exceptions-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Flora Dictionary API')
    .setDescription('The Flora Dictionary API description')
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new AllExceptionsFilter(),
    new ZodExceptionFilter(),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
