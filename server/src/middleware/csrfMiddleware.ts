import { Request, Response, NextFunction } from 'express';
import csrf from 'csrf';
import { RedisClient } from '../utils/redis';
import { ValidationError } from '../utils/errors';

export const tokens = new csrf();

export const csrfProtection = {
  generateToken: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = tokens.secretSync();
      const token = tokens.create(secret);
      
      await RedisClient.set(
        `csrf:${token}`,
        secret,
        undefined, // no NX/XX mode
        'EX',      // expiration type
        86400      // expiration time in seconds
      );
      
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 86400 // 24 hours
      });

      res.locals.csrfToken = token;
      next();
    } catch (err) {
      next(err);
    }
  },

  validateToken: async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
      if (!csrfToken) {
        throw new ValidationError('CSRF token required', {
          status: 403,
          code: 'MISSING_CSRF_TOKEN'
        });
      }
      
      const secret = await RedisClient.get(`csrf:${csrfToken}`);
      if (!secret) {
        throw new ValidationError('Invalid CSRF token (expired or invalid)', {
          status: 403,
          code: 'INVALID_CSRF_TOKEN'
        });
      }
      
      if (!tokens.verify(secret, csrfToken)) {
        throw new ValidationError('Invalid CSRF token', {
          status: 403,
          code: 'INVALID_CSRF_TOKEN'
        });
      }
      
      // Delete token after successful validation to prevent replay attacks
      await RedisClient.del(`csrf:${csrfToken}`);
      next();
    } catch (err) {
      next(err);
    }
  }
};