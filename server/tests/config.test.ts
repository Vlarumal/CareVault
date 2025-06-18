import config from '../src/config';
import { describe, expect, it } from '@jest/globals';

describe('Configuration', () => {
  it('should have default origins in development', () => {
    expect(config.allowedOrigins).toContain('http://localhost:3000');
    expect(config.allowedOrigins).toContain('http://localhost:3001');
  });

  it('should throw in production if URLs missing', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    try {
      // Remove URLs to test validation
      const originalAppUrl = process.env.APP_URL;
      const originalAdminUrl = process.env.ADMIN_URL;
      delete process.env.APP_URL;
      delete process.env.ADMIN_URL;

      expect(() => require('../src/config')).toThrow();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should have development as default env', () => {
    expect(config.env).toBe('development');
  });

  it('should have required properties', () => {
    expect(config).toHaveProperty('allowedOrigins');
    expect(Array.isArray(config.allowedOrigins)).toBe(true);
  });
});