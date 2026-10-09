import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import * as compression from 'compression'
import { AppModule } from './app.module'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for WebSocket support
  }))
  
  app.use(compression())

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
    })
  )

  // API versioning
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/metrics'],
  })

  // Swagger documentation
  if (configService.get('ENABLE_API_DOCS', 'false') === 'true') {
    const config = new DocumentBuilder()
      .setTitle('SyncSpace API')
      .setDescription('Real-Time Collaborative Workspace API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('workspaces', 'Workspace management')
      .addTag('chat', 'Real-time messaging')
      .addTag('projects', 'Project management')
      .addTag('tasks', 'Task management')
      .addTag('documents', 'Collaborative documents')
      .addTag('files', 'File management')
      .addTag('notifications', 'Notification system')
      .addTag('analytics', 'Analytics and reporting')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    })

    logger.log('Swagger documentation available at /api/docs')
  }

  const port = configService.get('PORT', 4000)
  await app.listen(port)

  logger.log(`SyncSpace API running on port ${port}`)
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`)
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})