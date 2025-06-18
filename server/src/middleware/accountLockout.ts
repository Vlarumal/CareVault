import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncMiddleware';
import { RedisClient } from '../utils/redis';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_SECONDS = LOCKOUT_MINUTES * 60;

// Distributed lock acquisition with exponential backoff
async function acquireLock(key: string, ttl: number = 10000): Promise<boolean> {
  const redis = RedisClient.getInstance();
  const lockKey = `lock:${key}`;
  const start = Date.now();
  const maxWait = 5000; // 5s max wait for lock
  
  while (Date.now() - start < maxWait) {
    const acquired = await redis.set(lockKey, '1', {
      NX: true,
      PX: ttl
    });
    
    if (acquired === 'OK') return true;
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms backoff
  }
  
  return false;
}

async function releaseLock(key: string): Promise<void> {
  const redis = RedisClient.getInstance();
  await redis.del(`lock:${key}`);
}

export const checkAccountLockout = asyncHandler<void>(
  async (req: Request, _res: Response, next: NextFunction) => {
    const { email } = req.body;
    const ip = req.ip;
    const redis = RedisClient.getInstance();

    try {
      // Use composite key for distributed tracking
      const lockoutKey = `lockout:${email || ip}`;
      
      if (!await acquireLock(lockoutKey)) {
        throw new ValidationError('System busy, please try again', { status: 429 });
      }
      
      try {
        const attempts = await redis.get(lockoutKey) || '0';
        
        if (parseInt(attempts) >= MAX_ATTEMPTS) {
          await redis.expire(lockoutKey, LOCKOUT_SECONDS);
          throw new ValidationError(
            `Account temporarily locked. Try again in ${LOCKOUT_MINUTES} minutes.`,
            { status: 429 }
          );
        }
        
        next();
      } finally {
        await releaseLock(lockoutKey);
      }
    } catch (error) {
      next(error);
    }
  }
);

export const recordFailedAttempt = async (
  email: string | null,
  ip: string
) => {
  const redis = RedisClient.getInstance();
  const key = email ? `lockout:${email}` : `lockout:${ip}`;
  
  // Use Redis pipeline for atomic operations
  const pipeline = redis.multi();
  pipeline.incr(key);
  pipeline.expire(key, LOCKOUT_SECONDS, 'NX'); // Set TTL only on first set
  await pipeline.exec();
};
