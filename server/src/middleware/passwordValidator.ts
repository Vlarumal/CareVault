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
        code: 'PASSWORD_TOO_SHORT',
        details: {
          password: 'Too short',
          minLength: 8
        },
      }
    );
  }

  if (!/[A-Z]/.test(password)) {
    throw new ValidationError(
      'Password must contain an uppercase letter',
      {
        status: 400,
        code: 'PASSWORD_MISSING_UPPERCASE',
        details: {
          password: 'Missing uppercase',
          requirement: 'At least one A-Z character'
        },
      }
    );
  }

  if (!/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain a number', {
      status: 400,
      code: 'PASSWORD_MISSING_NUMBER',
      details: {
        password: 'Missing number',
        requirement: 'At least one 0-9 character'
      },
    });
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new ValidationError(
      'Password must contain a special character',
      {
        status: 400,
        code: 'PASSWORD_MISSING_SPECIAL_CHAR',
        details: {
          password: 'Missing special character',
          requirement: 'At least one non-alphanumeric character'
        },
      }
    );
  }

  const { score, guesses } = zxcvbn(password);
  
  if (score < 3) {
    throw new ValidationError('Password is too weak', {
      status: 400,
      code: 'PASSWORD_TOO_WEAK',
      details: {
        password: 'Insufficient strength',
        score: score,
        suggestions: ['Add more complexity', 'Avoid common patterns']
      }
    });
  }

  if (guesses < 1e6) {
    throw new ValidationError('Password is too common', {
      status: 400,
      code: 'PASSWORD_TOO_COMMON',
      details: {
        password: 'Common password detected',
        guesses: guesses
      }
    });
  }

  next();
};
