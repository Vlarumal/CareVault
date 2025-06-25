import { Request, Response, NextFunction } from 'express';
import config from '../config';
import logger from '../utils/logger';

const allowedOrigins = new Set(config.allowedOrigins);

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  
  // Validate origin against allowed list
  // In development, allow all origins for easier debugging
  if (config.env === 'development' || config.env === 'test') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin'); // Important for caching
  }

  // Security headers
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-User-Id');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    // Preflight request
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, Idempotency-Key, X-CSRF-Token, X-Requested-With, X-User-Id'
    );
    res.status(204).end();
    return;
  }

  // Log suspicious CORS requests
  if (origin && !allowedOrigins.has(origin)) {
    logger.warn(`Blocked CORS request from origin: ${origin}`, {
      path: req.path,
      method: req.method
    });
  }

  next();
};

export default corsMiddleware;