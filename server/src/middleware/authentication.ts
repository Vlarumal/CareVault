import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
    };
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
    res.status(204).end();
    return;
  }

  // In a real app, this would verify JWT or session
  // For now we'll just require an X-User-Id header
  let userId = req.headers['x-user-id'];
  
  if (!userId || typeof userId !== 'string') {
    if (process.env.NODE_ENV === 'production') {
      throw new ValidationError('Missing or invalid X-User-Id header', {
        missingField: 'X-User-Id'
      });
    } else {
      // Use mock user ID in development
      userId = 'dev-user-id';
    }
  }

  req.user = { id: userId };
  next();
};

export default authenticate;