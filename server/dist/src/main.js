"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const platform_ws_1 = require("@nestjs/platform-ws");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const path_1 = require("path");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./platform/http/filters/all-exceptions.filter");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    console.log(`Starting bootstrap... [${new Date().toISOString()}]`);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: false });
    const publicPath = (0, path_1.join)(process.cwd(), 'public');
    console.log(`[StaticAssets] Serving from: ${publicPath}`);
    app.useStaticAssets(publicPath);
    app.useWebSocketAdapter(new platform_ws_1.WsAdapter(app));
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 9100);
    const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:3000');
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: [
            corsOrigin,
            'https://cockpit.ripun.site',
            'https://cognode.ripun.site',
            'http://localhost:3000',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'x-csrf-token', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Cockpit Production API')
        .setDescription('NestJS API for Cockpit & Cocktail')
        .setVersion('1.0')
        .addCookieAuth('sid')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.listen(port);
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map