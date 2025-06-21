import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { ValidationError } from './errors';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN) : 86400; // Default 24h in seconds
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || '';
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '';

if (!JWT_PRIVATE_KEY || !JWT_PUBLIC_KEY) {
  throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be defined in environment variables');
}

interface CustomJwtPayload extends JwtPayload {
  userId: string;
  role: string;
  permissions: string[];
}

const jwtOptions: SignOptions = {
  expiresIn: JWT_EXPIRES_IN,
  algorithm: 'RS256'
};

export const generateToken = (
  userId: string,
  role: string,
  permissions: string[],
  options?: SignOptions
): string => {
  return jwt.sign(
    { userId, role, permissions },
    JWT_PRIVATE_KEY,
    {
      ...jwtOptions,
      ...options
    }
  );
};

export const verifyToken = (token: string): CustomJwtPayload => {
  try {
    const payload = jwt.verify(token, JWT_PUBLIC_KEY);
    if (typeof payload === 'string' || !('userId' in payload)) {
      throw new Error('Invalid token payload');
    }
    
    return payload as CustomJwtPayload;
  } catch (error) {
    throw new ValidationError('Invalid or expired token', {
      status: 401,
      code: 'INVALID_TOKEN'
    });
  }
};
