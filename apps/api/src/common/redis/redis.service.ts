import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private redisClient: Redis

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379')
      
      this.redisClient = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })

      this.redisClient.on('connect', () => {
        this.logger.log('Connected to Redis')
      })

      this.redisClient.on('ready', () => {
        this.logger.log('Redis connection is ready')
      })

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error:', error)
      })

      this.redisClient.on('close', () => {
        this.logger.warn('Redis connection closed')
      })

      await this.redisClient.connect()
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error)
      throw error
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.disconnect()
      this.logger.log('Disconnected from Redis')
    }
  }

  getClient(): Redis {
    return this.redisClient
  }

  // Common Redis operations
  async set(key: string, value: string | number | Buffer, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redisClient.setex(key, ttl, value)
      } else {
        await this.redisClient.set(key, value)
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error)
      throw error
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key)
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error)
      return null
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.redisClient.del(key)
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error)
      return 0
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key)
      return result === 1
    } catch (error) {
      this.logger.error(`Failed to check if key exists ${key}:`, error)
      return false
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redisClient.expire(key, seconds)
      return result === 1
    } catch (error) {
      this.logger.error(`Failed to set expiration for key ${key}:`, error)
      return false
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.redisClient.hset(key, field, value)
    } catch (error) {
      this.logger.error(`Failed to hset key ${key}, field ${field}:`, error)
      throw error
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redisClient.hget(key, field)
    } catch (error) {
      this.logger.error(`Failed to hget key ${key}, field ${field}:`, error)
      return null
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.redisClient.hgetall(key)
    } catch (error) {
      this.logger.error(`Failed to hgetall key ${key}:`, error)
      return {}
    }
  }

  async hdel(key: string, field: string): Promise<number> {
    try {
      return await this.redisClient.hdel(key, field)
    } catch (error) {
      this.logger.error(`Failed to hdel key ${key}, field ${field}:`, error)
      return 0
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<number> {
    try {
      return await this.redisClient.sadd(key, member)
    } catch (error) {
      this.logger.error(`Failed to sadd key ${key}, member ${member}:`, error)
      return 0
    }
  }

  async srem(key: string, member: string): Promise<number> {
    try {
      return await this.redisClient.srem(key, member)
    } catch (error) {
      this.logger.error(`Failed to srem key ${key}, member ${member}:`, error)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redisClient.smembers(key)
    } catch (error) {
      this.logger.error(`Failed to smembers key ${key}:`, error)
      return []
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.redisClient.sismember(key, member)
      return result === 1
    } catch (error) {
      this.logger.error(`Failed to sismember key ${key}, member ${member}:`, error)
      return false
    }
  }

  // List operations
  async lpush(key: string, value: string): Promise<number> {
    try {
      return await this.redisClient.lpush(key, value)
    } catch (error) {
      this.logger.error(`Failed to lpush key ${key}:`, error)
      return 0
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.redisClient.rpop(key)
    } catch (error) {
      this.logger.error(`Failed to rpop key ${key}:`, error)
      return null
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redisClient.lrange(key, start, stop)
    } catch (error) {
      this.logger.error(`Failed to lrange key ${key}:`, error)
      return []
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.redisClient.publish(channel, message)
    } catch (error) {
      this.logger.error(`Failed to publish to channel ${channel}:`, error)
      return 0
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redisClient.ping()
      return result === 'PONG'
    } catch (error) {
      this.logger.error('Redis health check failed:', error)
      return false
    }
  }

  // Cache helpers for common patterns
  async cacheSet<T>(key: string, data: T, ttl?: number): Promise<void> {
    const serializedData = JSON.stringify(data)
    await this.set(key, serializedData, ttl)
  }

  async cacheGet<T>(key: string): Promise<T | null> {
    const data = await this.get(key)
    if (!data) return null
    
    try {
      return JSON.parse(data) as T
    } catch (error) {
      this.logger.error(`Failed to parse cached data for key ${key}:`, error)
      return null
    }
  }

  // Session management
  async setUserSession(userId: string, sessionData: any, ttl = 86400): Promise<void> {
    const key = `session:${userId}`
    await this.cacheSet(key, sessionData, ttl)
  }

  async getUserSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`
    return this.cacheGet(key)
  }

  async deleteUserSession(userId: string): Promise<void> {
    const key = `session:${userId}`
    await this.del(key)
  }

  // Presence management
  async setUserOnline(userId: string, workspaceId?: string): Promise<void> {
    const globalKey = `online:users`
    const workspaceKey = workspaceId ? `online:workspace:${workspaceId}` : null
    
    await this.sadd(globalKey, userId)
    if (workspaceKey) {
      await this.sadd(workspaceKey, userId)
    }
    
    // Set expiration for cleanup
    await this.expire(globalKey, 3600) // 1 hour
    if (workspaceKey) {
      await this.expire(workspaceKey, 3600)
    }
  }

  async setUserOffline(userId: string, workspaceId?: string): Promise<void> {
    const globalKey = `online:users`
    const workspaceKey = workspaceId ? `online:workspace:${workspaceId}` : null
    
    await this.srem(globalKey, userId)
    if (workspaceKey) {
      await this.srem(workspaceKey, userId)
    }
  }

  async getOnlineUsers(workspaceId?: string): Promise<string[]> {
    const key = workspaceId ? `online:workspace:${workspaceId}` : `online:users`
    return this.smembers(key)
  }

  async isUserOnline(userId: string, workspaceId?: string): Promise<boolean> {
    const key = workspaceId ? `online:workspace:${workspaceId}` : `online:users`
    return this.sismember(key, userId)
  }
}