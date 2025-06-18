import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import zxcvbn from 'zxcvbn';

export const validatePassword = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { password } = req.body;

  if (!password || password.length < 8) {
    throw new ValidationError(
      'Password must be at least 8 characters',
      {
        status: 400,
        details: { password: 'Too short' },
      }
    );
  }

  if (!/[A-Z]/.test(password)) {
    throw new ValidationError(
      'Password must contain an uppercase letter',
      {
        status: 400,
        details: { password: 'Missing uppercase' },
      }
    );
  }

  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain a number', {
      status: 400,
      details: { password: 'Missing number' },
    });
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new ValidationError(
      'Password must contain a special character',
      {
        status: 400,
        details: { password: 'Missing special character' },
      }
    );
  }

  const { score, guesses } = zxcvbn(password);
  
  if (score < 3) {
    throw new ValidationError('Password is too weak', {
      status: 400,
      details: {
        password: 'Insufficient strength',
        suggestions: ['Add more complexity', 'Avoid common patterns']
      }
    });
  }

  if (guesses < 1e6) {
    throw new ValidationError('Password is too common', {
      status: 400,
      details: { password: 'Common password detected' }
    });
  }

  next();
};
