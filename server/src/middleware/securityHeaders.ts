import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import config from '../config';
import crypto from 'crypto';

const securityHeaders = [
  helmet(),
  (_req: Request, res: Response, next: NextFunction) => {
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'same-origin');
    
    // CSP header with nonce support
    if (config.env === 'production') {
      const nonce = Buffer.from(crypto.randomBytes(16)).toString('base64');
      res.locals.cspNonce = nonce;
      
      res.header(
        'Content-Security-Policy',
        `default-src 'self'; ` +
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; ` +
        `style-src 'self' 'nonce-${nonce}'; ` +
        `img-src 'self' data:; ` +
        `connect-src 'self'; ` +
        `base-uri 'self'; ` +
        `form-action 'self'; ` +
        `frame-ancestors 'none'`
      );
    }

    next();
  }
];

export default securityHeaders;