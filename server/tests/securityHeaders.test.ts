import request from 'supertest';
import express from 'express';
import securityHeaders from '../src/middleware/securityHeaders';

describe('Security Headers Middleware', () => {
  const app = express();
  
  if (Array.isArray(securityHeaders)) {
    securityHeaders.forEach(middleware => app.use(middleware));
  } else {
    app.use(securityHeaders);
  }
  
  app.get('/test', (_req, res) => {
    res.send('OK');
  });

  it('should set basic security headers', async () => {
    const res = await request(app).get('/test');
    expect(res.header).toMatchObject({
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'same-origin'
    });
  });

  it('should set CSP header in production', async () => {
    process.env.NODE_ENV = 'production';
    try {
      const res = await request(app).get('/test');
      expect(res.header['content-security-policy']).toMatch(
        /default-src 'self';/
      );
    } finally {
      process.env.NODE_ENV = 'test';
    }
  });

  it('should include helmet middleware', async () => {
    const res = await request(app).get('/test');
    expect(res.header['x-powered-by']).toBeUndefined();
    expect(res.header['x-dns-prefetch-control']).toBe('off');
  });

  it('should handle multiple middleware correctly', () => {
    expect(securityHeaders.length).toBeGreaterThan(1);
    expect(typeof securityHeaders[0]).toBe('function');
    expect(typeof securityHeaders[1]).toBe('function');
  });
});
