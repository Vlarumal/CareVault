import jwt, { SignOptions, JwtHeader } from 'jsonwebtoken';
import { ValidationError } from './errors';
import { RedisClient } from './redis';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import cron from 'node-cron';

const JWT_KEY_PREFIX = 'jwt_secret:';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN) || 86400 : 86400; // Default 24h in seconds

interface JwtPayload {
  userId: string;
  role: string;
  permissions: string[];
  keyId?: string;
}

async function generateNewSecret(keyId: string): Promise<string> {
  const redis = RedisClient.getInstance();
  const secret = crypto.randomBytes(64).toString('hex');
  await redis.set(`${JWT_KEY_PREFIX}${keyId}`, secret, {
    EX: JWT_EXPIRES_IN * 2 // Longer TTL than tokens
  });
  return secret;
}

async function getActiveSecrets(): Promise<{ [keyId: string]: string }> {
  const redis = RedisClient.getInstance();
  const keys = await redis.keys(`${JWT_KEY_PREFIX}*`);
  const secrets: { [keyId: string]: string } = {};
  
  for (const key of keys) {
    const keyId = key.replace(JWT_KEY_PREFIX, '');
    const secret = await redis.get(key);
    if (secret) {
      secrets[keyId] = secret;
    }
  }
  
  return secrets;
}

const jwtOptions: SignOptions = {
  expiresIn: JWT_EXPIRES_IN,
  algorithm: 'HS256'
};

export const generateToken = async (
  userId: string,
  role: string,
  permissions: string[],
  options?: SignOptions
): Promise<string> => {
  const keyId = uuid();
  
  const secret = await generateNewSecret(keyId);
  
  return jwt.sign(
    { userId, role, permissions },
    secret,
    {
      ...jwtOptions,
      ...options,
      header: { kid: keyId } as JwtHeader
    }
  );
};

export const verifyToken = async (token: string): Promise<JwtPayload> => {
  try {
    const header = jwt.decode(token, { complete: true })?.header as (JwtHeader & { kid?: string });
    if (!header?.kid) {
      throw new Error('Missing key ID in token header');
    }
    
    const redis = RedisClient.getInstance();
    const secret = await redis.get(`${JWT_KEY_PREFIX}${header.kid}`);
    if (!secret) {
      throw new Error('Invalid or expired key ID');
    }
    
    // Verify token
    const payload = jwt.verify(token, secret);
    if (typeof payload === 'string' || !('userId' in payload)) {
      throw new Error('Invalid token payload');
    }
    
    return payload as JwtPayload;
  } catch (error) {
    throw new ValidationError('Invalid or expired token', {
      status: 401,
      code: 'INVALID_TOKEN'
    });
  }
};

export const generateRefreshToken = async (userId: string, role: string, permissions: string[]): Promise<string> => {
  const tokenId = uuid();
  const secret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
  
  await RedisClient.getInstance().set(
    `refresh_token:${tokenId}`,
    JSON.stringify({ userId, role, permissions }),
    { EX: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || '604800') } // 7 days default
  );
  
  // Convert expiresIn to seconds if it contains time units (e.g. '7d' -> 604800)
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  const expiresInSeconds = expiresIn.includes('d')
    ? parseInt(expiresIn) * 86400
    : expiresIn.includes('h')
      ? parseInt(expiresIn) * 3600
      : parseInt(expiresIn);

  const options: jwt.SignOptions = {
    expiresIn: expiresInSeconds,
    algorithm: 'HS256'
  };

  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId, role, tokenId },
      secret,
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, role: string, permissions: string[], tokenId: string };
    
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

export async function initJwtSecrets() {
  const secrets = await getActiveSecrets();
  if (Object.keys(secrets).length === 0) {
    await generateNewSecret('initial');
  }
  
  // Setup daily rotation cron job
  cron.schedule('0 0 * * *', async () => {
    await generateNewSecret(uuid());
  });
}
