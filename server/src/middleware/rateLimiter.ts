import rateLimit from 'express-rate-limit';
import { RedisClient } from '../utils/redis';
import logger from '../utils/logger';

const createRedisStore = (prefix: string) => {
  return {
    async increment(key: string): Promise<{
      totalHits: number;
      resetTime: Date;
    }> {
      try {
        const redis = RedisClient.getInstance();
        const fullKey = `${prefix}:${key}`;
        const count = await redis.incr(fullKey);
        if (count === 1) {
          await redis.expire(fullKey, 15 * 60); // 15 minutes TTL
        }
        return {
          totalHits: count,
          resetTime: new Date(Date.now() + 15 * 60 * 1000),
        };
      } catch (err) {
        logger.error('Rate limiter error:', err);
        throw err;
      }
    },

    async decrement(key: string) {
      try {
        const redis = RedisClient.getInstance();
        await redis.decr(`${prefix}:${key}`);
      } catch (err) {
        logger.error('Rate limiter error:', err);
      }
    },

    async resetKey(key: string) {
      try {
        const redis = RedisClient.getInstance();
        await redis.del(`${prefix}:${key}`);
      } catch (err) {
        logger.error('Rate limiter error:', err);
      }
    },
  };
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('auth'),
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('password_reset'),
});
