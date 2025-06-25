import { Router } from 'express';
import type { Request, Response } from 'express-serve-static-core';
import { RedisClient } from '../utils/redis';
import { csrfProtection, tokens } from '../middleware/csrfMiddleware';
import {
  authRateLimiter,
  passwordResetLimiter,
  loginRateLimiter,
} from '../middleware/rateLimiter';

import crypto from 'crypto';
import { generateToken } from '../utils/jwtUtils';

import {
  generateRefreshToken,
  verifyRefreshToken,
  invalidateToken,
} from '../utils/refreshTokenUtils';
import {
  generateVerificationToken,
  validateVerificationToken
} from '../services/verificationService';
import pool from '../../db/connection';
import { ValidationError } from '../utils/errors';
import { validatePassword } from '../middleware/passwordValidator';
import {
  checkAccountLockout,
  recordFailedAttempt,
} from '../middleware/accountLockout';
import { ipBlocker } from '../middleware/ipBlocker';
import { asyncHandler } from '../utils/asyncMiddleware';
import { hash } from 'bcrypt';
import securityHeaders  from '../middleware/securityHeaders';

const authRouter = Router();

authRouter.get('/csrf-token', csrfProtection.generateToken, (_req: Request, res: Response) => {
  res.json({ csrfToken: res.locals.csrfToken });
});

authRouter.post('/refresh-csrf',
  asyncHandler<void>(async (_req: Request, res: Response) => {
    try {
      const secret = tokens.secretSync();
      const token = tokens.create(secret);
      
      await RedisClient.set(
        `csrf:${token}`,
        secret,
        undefined,
        'EX',
        86400
      );
      
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 86400
      });
      
      res.json({ csrfToken: token });
    } catch (error) {
      res.status(500).json({ error: 'Failed to refresh CSRF token' });
    }
  })
);

authRouter.post(
  '/register',
  authRateLimiter,
  validatePassword,
  csrfProtection.validateToken,
  asyncHandler<void>(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    try {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new ValidationError('Email already registered', {
          status: 400,
          details: {
            email: 'Email already in use',
            status: 400,
          },
        });
      }

      const hashedPassword = await hash(password, 12);

      if (!email || !name) {
        throw new ValidationError('Email and name are required', {
          status: 400,
          details: {
            email: !email ? 'Email is required' : undefined,
            name: !name ? 'Name is required' : undefined,
          },
        });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const result = await client.query(
          `INSERT INTO users (email, password, name)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [email, hashedPassword, name]
        );

        await client.query(
          'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
          [result.rows[0].id, 'user']
        );

        await client.query('COMMIT');

        const userId = result.rows[0].id;
        const accessToken = await generateToken(
          userId,
          'user',
          ['patients:read', 'entries:read']
        );
        const refreshToken = await generateRefreshToken(
          userId,
          'user',
          ['patients:read', 'entries:read']
        );
        
        // // Send verification email
        // await generateVerificationToken(userId, email);
        res.status(201).json({
          accessToken,
          refreshToken,
          user: {
            id: result.rows[0].id,
            role: 'user',
          },
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(error.status).json({
          error: error.message,
          details: error.details,
        });
      } else {
        // Generate new CSRF token on failure
        try {
          const secret = tokens.secretSync();
          const token = tokens.create(secret);
          
          await RedisClient.set(
            `csrf:${token}`,
            secret,
            undefined,
            'EX',
            86400
          );
          
          res.cookie('XSRF-TOKEN', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 86400
          });
          
          res.status(500).json({
            error: 'Registration failed',
            csrfToken: token
          });
        } catch (csrfError) {
          res.status(500).json({ error: 'Registration and CSRF token refresh failed' });
        }
      }
    }
  })
);

authRouter.post(
  '/login',
  ipBlocker,
  loginRateLimiter,
  checkAccountLockout,
  asyncHandler<void>(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, password FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        await recordFailedAttempt(null, req.ip || 'unknown');
        res.status(401).json({
          error: 'Invalid credentials',
          details: { email: 'Invalid email or password' },
        });
        return;
      }

      const { compare } = await import('bcrypt');
      const passwordMatch = await compare(
        password,
        result.rows[0].password
      );

      if (!passwordMatch) {
        await recordFailedAttempt(
          result.rows[0].id,
          req.ip || 'unknown'
        );
        res.status(401).json({
          error: 'Invalid credentials',
          details: { email: 'Invalid email or password' },
        });
        return;
      }

      const roleResult = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [result.rows[0].id]
      );

      const role = roleResult.rows[0]?.role || 'user';
      const permissions =
        role === 'admin'
          ? [
              'patients:read',
              'patients:write',
              'entries:read',
              'entries:write',
            ]
          : ['patients:read', 'entries:read'];
      const accessToken = await generateToken(
        result.rows[0].id,
        role,
        permissions
      );
      const refreshToken = await generateRefreshToken(
        result.rows[0].id,
        role,
        permissions
      );

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: result.rows[0].id,
          role,
        },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Login failed' });
      }
    }
  })
);

authRouter.post(
  '/request-password-reset',
  passwordResetLimiter,
  asyncHandler(
    async (
      req: Request<{}, {}, { email: string }>,
      res: Response<
        { message: string; resetLink?: string } | { error: string }
      >
    ): Promise<void> => {
      const { email } = req.body;

      try {
        const result = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (result.rows.length === 0) {
          res.status(200).json({
            message:
              'If an account exists, a reset email has been sent',
          });
          return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration

        await pool.query(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
          [result.rows[0].id, token, expiresAt]
        );

        // In production: Send email with reset link
        const resetLink = `http://localhost:3001/reset-password?token=${token}`;

        res.status(200).json({
          message:
            'If an account exists, a reset email has been sent',
          resetLink, // Remove in production - for testing only
        });
      } catch (error) {
        res
          .status(500)
          .json({ error: 'Failed to process password reset' });
      }
    }
  )
);

authRouter.post(
  '/reset-password',
  validatePassword,
  asyncHandler<void>(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    try {
      const { hash } = await import('bcrypt');
      const hashedPassword = await hash(newPassword, 12);

      const result = await pool.query(
        `UPDATE users SET password = $1
       WHERE id IN (
         SELECT user_id FROM password_reset_tokens
         WHERE token = $2
         AND expires_at > NOW()
         AND used = false
       )
       RETURNING id`,
        [hashedPassword, token]
      );

      if (result.rows.length === 0) {
        throw new ValidationError('Invalid or expired token', {
          status: 400,
          details: { token: 'Invalid or expired' },
        });
      }

      await pool.query(
        'UPDATE password_reset_tokens SET used = true WHERE token = $1',
        [token]
      );

      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to reset password' });
      }
    }
  })
);

authRouter.post(
  '/refresh',
  asyncHandler<void>(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new ValidationError('Refresh token required', {
        status: 401,
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    try {
      const { userId, role, permissions } = await verifyRefreshToken(
        refreshToken
      );

      const newAccessToken = await generateToken(
        userId,
        role,
        permissions
      );
      const newRefreshToken = await generateRefreshToken(
        userId,
        role,
        permissions
      );

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        maxAge: parseInt(
          process.env.REFRESH_TOKEN_EXPIRES_IN || '604800000'
        ), // 7 days default
      });

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  })
);

authRouter.post(
  '/logout',
  asyncHandler<void>(async (req: Request, res: Response) => {
    let refreshToken;
    if (req.cookies) {
      refreshToken = req.cookies.refreshToken;
    }
    if (!refreshToken && req.body) {
      refreshToken = req.body.refreshToken;
    }

    if (refreshToken) {
      try {
        const { tokenId } = await verifyRefreshToken(refreshToken);
        await invalidateToken(tokenId);
      } catch (error) {
        // Continue even if token is invalid
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  })
);

authRouter.post(
  '/verify-email',
  authRateLimiter,
  securityHeaders,
  asyncHandler<void>(async (req: Request, res: Response) => {
    const { token } = req.body;
    
    try {
      const { email } = await validateVerificationToken(token);
      res.json({
        message: 'Email verified successfully',
        email
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(error.status).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Email verification failed' });
      }
    }
  })
);

authRouter.post(
  '/resend-verification',
  authRateLimiter,
  securityHeaders,
  asyncHandler<void>(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    try {
      const result = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        res.status(200).json({
          message: 'If an account exists, a verification email has been sent'
        });
        return;
      }

      await generateVerificationToken(result.rows[0].id, email);
      res.status(200).json({
        message: 'Verification email resent successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  })
);

export default authRouter;
