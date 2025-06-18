import { vi, describe, expect, beforeEach, it, Mock } from 'vitest';
import { TokenManager } from './tokenUtils';

const createValidToken = () => {
  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = btoa(JSON.stringify({ userId: 123, name: 'Test User' }));
  const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  return `${header}.${payload}.${signature}`;
};

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('TokenManager', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('validateToken', () => {
    it('should validate correct JWT format', () => {
      expect(TokenManager.validateToken(createValidToken())).toBe(true);
    });

    it('should reject tokens with missing parts', () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE6MjM5MDIyfQ';
      expect(TokenManager.validateToken(invalidToken)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(TokenManager.validateToken(null as unknown as string)).toBe(false);
      expect(TokenManager.validateToken(undefined as unknown as string)).toBe(false);
      expect(TokenManager.validateToken(123 as unknown as string)).toBe(false);
    });
  });

  describe('storeTokens', () => {
    it('should store tokens in localStorage and sessionStorage', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      TokenManager.storeTokens(accessToken, refreshToken);
      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', accessToken);
      expect(sessionStorage.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);
    });

    it('should remove tokens when null is passed', () => {
      TokenManager.storeTokens(null as unknown as string, null as unknown as string);
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should throw error when storage fails', () => {
      const error = new Error('Storage failed');
      (localStorage.setItem as Mock).mockImplementationOnce(() => {
        throw error;
      });

      expect(() => TokenManager.storeTokens('access', 'refresh')).toThrow('Failed to store tokens');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from storage', () => {
      const token = 'test-access-token';
      localStorage.setItem('accessToken', token);
      expect(TokenManager.getAccessToken()).toBe(token);
    });

    it('should return null when token is not found', () => {
      expect(TokenManager.getAccessToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from storage', () => {
      const token = 'test-refresh-token';
      sessionStorage.setItem('refreshToken', token);
      expect(TokenManager.getRefreshToken()).toBe(token);
    });

    it('should return null when token is not found', () => {
      expect(TokenManager.getRefreshToken()).toBeNull();
    });
  });
});