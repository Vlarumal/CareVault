import { createClient } from 'redis';
import logger from './logger';

class RedisClient {
  private static instance: RedisClient | null = null;
  private client!: ReturnType<typeof createClient>;
  private maxRetries = 5;
  private baseDelay = 1000; // 1 second
  private connected = false;
  private healthCheckInterval: NodeJS.Timeout;

  private constructor() {
    this.initClient();
    this.healthCheckInterval = setInterval(() => this.checkHealth(), 30000); // 30s health checks
  }

  private async initClient() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://redis:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              logger.error('Max Redis reconnection attempts reached');
              return new Error('Max retries reached');
            }
            const delay = Math.min(this.baseDelay * Math.pow(2, retries), 30000); // Max 30s
            logger.warn(`Redis reconnecting attempt ${retries}, waiting ${delay}ms`);
            return delay;
          },
          connectTimeout: 5000 // 5s
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.connected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
        this.connected = false;
      });

      await this.client.connect();
    } catch (err) {
      logger.error('Redis initial connection failed:', err);
      throw err;
    }
  }

  private async checkHealth() {
    try {
      if (!this.connected) return;
      await this.client.ping();
    } catch (err) {
      logger.error('Redis health check failed:', err);
      this.connected = false;
    }
  }

  public static getInstance(): ReturnType<typeof createClient> {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance.client;
  }

  public static async healthCheck() {
    try {
      const client = RedisClient.getInstance();
      await client.ping();
      return { status: 'healthy' };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      return { status: 'unhealthy', error };
    }
  }

  public static async cleanup() {
    if (RedisClient.instance) {
      clearInterval(RedisClient.instance.healthCheckInterval);
      await RedisClient.instance.client.quit();
      RedisClient.instance = null;
    }
  }
}

export { RedisClient };