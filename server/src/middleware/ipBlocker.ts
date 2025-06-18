import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncMiddleware';
import { RedisClient } from '../utils/redis';
import logger from '../utils/logger';

const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ATTEMPTS = 10;

export const ipBlocker = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const ip = req.ip;
    if (!ip) return next();

    try {
      const redis = RedisClient.getInstance();
      const key = `blocked:ip:${ip}`;
      const attemptsKey = `attempts:ip:${ip}`;

      const isBlocked = await redis.get(key);
      if (isBlocked) {
        logger.warn(`Blocked IP attempt: ${ip}`);
        return res.status(403).json({
          error: 'IP address blocked due to excessive requests',
        });
      }

      const attempts = await redis.incr(attemptsKey);
      if (attempts === 1) {
        await redis.expire(attemptsKey, BLOCK_DURATION);
      }

      if (attempts >= MAX_ATTEMPTS) {
        await redis.set(key, '1', { PX: BLOCK_DURATION });
        logger.warn(`IP blocked: ${ip}`);
        return res.status(403).json({
          error: 'IP address blocked due to excessive requests',
        });
      }

      next();
    } catch (error) {
      logger.error('IP blocking error:', error);
      next();
    }
  }
);
