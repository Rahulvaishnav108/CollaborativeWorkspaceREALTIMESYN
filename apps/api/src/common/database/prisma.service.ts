import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL')
    
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    })

    // Log slow queries in development
    if (configService.get('NODE_ENV') === 'development') {
      // @ts-ignore
      this.$on('query', (e) => {
        if (e.duration > 1000) {
          this.logger.warn(`Slow query: ${e.query} (${e.duration}ms)`)
        }
      })
    }

    // @ts-ignore
    this.$on('error', (e) => {
      this.logger.error('Prisma error:', e)
    })

    // @ts-ignore
    this.$on('warn', (e) => {
      this.logger.warn('Prisma warning:', e)
    })

    // @ts-ignore
    this.$on('info', (e) => {
      this.logger.log('Prisma info:', e)
    })
  }

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('Successfully connected to database')
    } catch (error) {
      this.logger.error('Failed to connect to database:', error)
      throw error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Disconnected from database')
  }

  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close()
    })
  }

  // Helper method to handle transactions with retry logic
  async transaction<T>(
    fn: (prisma: Omit<this, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let attempt = 0
    
    while (attempt < maxRetries) {
      try {
        return await this.$transaction(fn)
      } catch (error) {
        attempt++
        
        if (attempt >= maxRetries) {
          this.logger.error(`Transaction failed after ${maxRetries} attempts:`, error)
          throw error
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 100
        await new Promise(resolve => setTimeout(resolve, delay))
        
        this.logger.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`)
      }
    }
  }

  // Helper method for safe database operations
  async safeOperation<T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      this.logger.error('Database operation failed:', error)
      return fallback ?? null
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      this.logger.error('Database health check failed:', error)
      return false
    }
  }
}