import { ValidationError } from './errors';

export function validateEnv() {
  const requiredVars = [
    'JWT_SECRET',
    'REDIS_URL',
    'DATABASE_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new ValidationError(
      `Missing required environment variables: ${missingVars.join(', ')}`,
      { status: 500, code: 'ENV_MISSING' }
    );
  }

  if (process.env.PORT) {
    const port = parseInt(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new ValidationError(
        `Invalid PORT value: ${process.env.PORT}`,
        { status: 500, code: 'ENV_INVALID' }
      );
    }
  }

  if (process.env.JWT_EXPIRES_IN) {
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN);
    if (isNaN(expiresIn) || expiresIn <= 0) {
      throw new ValidationError(
        `Invalid JWT_EXPIRES_IN value: ${process.env.JWT_EXPIRES_IN}`,
        { status: 500, code: 'ENV_INVALID' }
      );
    }
  }
}