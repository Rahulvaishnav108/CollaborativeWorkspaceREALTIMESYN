import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

import { DatabaseModule } from './common/database/database.module'
import { RedisModule } from './common/redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { WorkspacesModule } from './workspaces/workspaces.module'
import { ChatModule } from './chat/chat.module'
import { ProjectsModule } from './projects/projects.module'
import { TasksModule } from './tasks/tasks.module'
import { DocumentsModule } from './documents/documents.module'
import { FilesModule } from './files/files.module'
import { NotificationsModule } from './notifications/notifications.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { HealthModule } from './common/health/health.module'
import { LoggerModule } from './common/logger/logger.module'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
          limit: configService.get('RATE_LIMIT_MAX_REQUESTS', 100),
        },
      ],
      inject: [ConfigService],
    }),

    // Static files (for uploads, avatars, etc.)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Core modules
    LoggerModule,
    DatabaseModule,
    RedisModule,
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ChatModule,
    ProjectsModule,
    TasksModule,
    DocumentsModule,
    FilesModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}