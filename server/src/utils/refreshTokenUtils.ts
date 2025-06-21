import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { RedisClient } from './redis';
import { ValidationError } from './errors';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET must be defined in environment variables');
}

export const generateRefreshToken = async (userId: string, role: string, permissions: string[]): Promise<string> => {
  const tokenId = uuid();
  
  await RedisClient.getInstance().set(
    `refresh_token:${tokenId}`,
    JSON.stringify({ userId, role, permissions }),
    { EX: parseInt(REFRESH_TOKEN_EXPIRES_IN) * 86400 } // Convert days to seconds
  );
  
  const expiresInSeconds = REFRESH_TOKEN_EXPIRES_IN.includes('d')
    ? parseInt(REFRESH_TOKEN_EXPIRES_IN) * 86400
    : REFRESH_TOKEN_EXPIRES_IN.includes('h')
      ? parseInt(REFRESH_TOKEN_EXPIRES_IN) * 3600
      : parseInt(REFRESH_TOKEN_EXPIRES_IN);

  const options: jwt.SignOptions = {
    expiresIn: expiresInSeconds,
    algorithm: 'HS256'  // Use symmetric algorithm for refresh tokens
  };

  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId, role, tokenId },
      JWT_REFRESH_SECRET,
      options,
      (err, token) => {
        if (err || !token) {
          reject(new Error('Failed to generate refresh token'));
        } else {
          resolve(token);
        }
      }
    );
  });
};

export const verifyRefreshToken = async (token: string): Promise<{userId: string, role: string, permissions: string[], tokenId: string}> => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string, role: string, tokenId: string };
    
    const storedToken = await RedisClient.getInstance().get(`refresh_token:${decoded.tokenId}`);
    if (!storedToken) {
      throw new Error('Invalid or expired refresh token');
    }
    
    const storedData = JSON.parse(storedToken);
    if (!storedData.permissions) {
      throw new Error('Invalid refresh token payload');
    }
    
    return {
      userId: decoded.userId,
      role: decoded.role,
      permissions: storedData.permissions,
      tokenId: decoded.tokenId
    };
  } catch (error) {
    throw new ValidationError('Invalid refresh token', {
      status: 401,
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
};

export const invalidateToken = async (tokenId: string): Promise<void> => {
  await RedisClient.getInstance().del(`refresh_token:${tokenId}`);
};

export const blacklistToken = async (tokenId: string, expiresIn: number): Promise<void> => {
  const redis = RedisClient.getInstance();
  await redis.set(`token_blacklist:${tokenId}`, '1', {
    EX: expiresIn
  });
};

export const isTokenBlacklisted = async (tokenId: string): Promise<boolean> => {
  const redis = RedisClient.getInstance();
  const result = await redis.exists(`token_blacklist:${tokenId}`);
  return result === 1;
};