import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './platform/http/filters/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    console.log(`Starting bootstrap... [${new Date().toISOString()}]`);
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });

    // Serve public files
    const publicPath = join(process.cwd(), 'public');
    console.log(`[StaticAssets] Serving from: ${publicPath}`);
    app.useStaticAssets(publicPath);

    // Enable WebSocket Adapter (ws)
    app.useWebSocketAdapter(new WsAdapter(app));

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 9100);
    const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'); // Note: This variable is unused in original code but kept for consistency

    // Use Pino logger
    app.useLogger(app.get(Logger));

    // Security headers
    app.use(helmet());

    // Cookie parser
    app.use(cookieParser());

    // CORS with credentials
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'x-csrf-token', 'Authorization'],
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('Cockpit Production API')
        .setDescription('NestJS API for Cockpit & Cocktail')
        .setVersion('1.0')
        .addCookieAuth('sid')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.listen(port);
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
