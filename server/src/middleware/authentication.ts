import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import pool from '../../db/connection';
import { verifyToken } from '../utils/jwtUtils';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      role?: 'admin' | 'user';
    };
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    res.status(204).end();
    return;
  }

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new ValidationError('Authorization token required', {
      status: 401,
      code: 'MISSING_TOKEN',
    });
  }

  try {
    if (token === process.env.AUTH_TEST_TOKEN && (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
      req.user = {
        id: 'test-user',
        role: 'admin'
      };
      next();
      return;
    }

    const payload = verifyToken(token);
    
    if (!payload.permissions?.includes('entries:write')) {
      throw new ValidationError('Insufficient permissions', {
        status: 403,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }
    
    const userResult = await pool.query(
      `SELECT u.id, ur.role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (userResult.rowCount === 0) {
      throw new ValidationError('User not found', {
        status: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    req.user = {
      id: userResult.rows[0].id,
      role: userResult.rows[0].role || 'user',
    };

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new ValidationError('Token expired', {
        status: 401,
        code: 'TOKEN_EXPIRED',
      });
    }
    
    throw new ValidationError('Invalid token', {
      status: 401,
      code: 'INVALID_TOKEN',
    });
  }
};

export const adminOnly = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user?.role || req.user.role !== 'admin') {
    throw new ValidationError('Admin privileges required', {
      status: 403,
      requiredRole: 'admin',
    });
  }
  next();
};

export default authenticate;
