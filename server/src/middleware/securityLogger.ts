import { Request, Response, NextFunction } from 'express';
import { RateLimitInfo } from 'express-rate-limit';
import logger from '../utils/logger';
import { RedisClient } from '../utils/redis';

interface ExtendedRateLimitInfo extends RateLimitInfo {
  windowStart: number;
  remaining: number;
}

export const logRateLimitedRequest = async (
  req: Request,
  _res: Response,
  next: NextFunction,
  info: ExtendedRateLimitInfo
) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    method: req.method,
    path: req.path,
    windowStart: new Date(info.windowStart).toISOString(),
    remainingRequests: info.remaining,
    type: 'rate_limit'
  };

  try {
    const client = RedisClient.getInstance();
    // Main log storage (30 days retention)
    await client.lPush('security_logs', JSON.stringify(logEntry));
    await client.lTrim('security_logs', 0, 9999);
    
    // Daily archive (compressed, 1 year retention)
    const today = new Date().toISOString().split('T')[0];
    await client.lPush(`security_logs:archive:${today}`, JSON.stringify(logEntry));
    
    // Weekly summary stats
    if (logEntry.type === 'rate_limit') {
      await client.hIncrBy('security_stats:rate_limits', today, 1);
    }
  } catch (err) {
    logger.error('Failed to log to Redis', { error: err });
  }

  logger.warn(`Rate limited request: ${req.method} ${req.path} from IP ${req.ip}`, logEntry);
  next();
};
