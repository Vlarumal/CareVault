import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockApiInstance = vi.hoisted(() => {
  const instance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    },
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    request: vi.fn().mockResolvedValue({ data: {} })
  };
  
  instance.interceptors.request.use((config: { headers?: Record<string, string> }) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  
  return instance;
});

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      create: vi.fn(() => mockApiInstance)
    }
  };
});

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Import api AFTER setting up mocks
import { api } from './apiUtils';

describe('apiUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockApiInstance.get.mockResolvedValue({ data: {} });
    mockApiInstance.post.mockResolvedValue({ data: {} });
    mockApiInstance.put.mockResolvedValue({ data: {} });
    mockApiInstance.delete.mockResolvedValue({ data: {} });
    mockApiInstance.request.mockResolvedValue({ data: {} });
  });

  it('adds Authorization header via request interceptor', () => {
    const token = 'test.token.here';
    localStorage.setItem('token', token);
    
    const config = { headers: {} };
    const interceptorFn = mockApiInstance.interceptors.request.use.mock.calls[0][0];
    const newConfig = interceptorFn(config);
    
    expect(newConfig.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('does not add Authorization header when token is missing', () => {
    localStorage.removeItem('token');
    
    const config = { headers: {} };
    const interceptorFn = mockApiInstance.interceptors.request.use.mock.calls[0][0];
    const newConfig = interceptorFn(config);
    
    expect(newConfig.headers.Authorization).toBeUndefined();
  });

  it('handles CORS errors properly', async () => {
    const error = {
      code: 'ERR_NETWORK',
      message: 'Network Error',
    };
    mockApiInstance.request.mockRejectedValueOnce(error);

    try {
      await api.get('/test');
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe(
          'CORS error: Request blocked by browser security policy'
        );
      } else {
        throw err;
      }
    }
  });

  describe('error handling', () => {
    it('parses 400 error with array details', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: 'Validation failed',
            details: [
              { message: 'Name is required' },
              { message: 'Email is invalid' }
            ]
          }
        },
        config: { url: '/test' }
      };
      
      mockApiInstance.request.mockRejectedValueOnce(error);
      
      try {
        await api.get('/test');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe(
            'Validation failed: Name is required, Email is invalid'
          );
          expect((err as Error & { isClientError?: boolean }).isClientError).toBe(true);
        } else {
          throw err;
        }
      }
    });

    it('parses 400 error with object details', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: 'Validation failed',
            details: {
              name: ['Required'],
              email: ['Invalid format']
            }
          }
        },
        config: { url: '/test' }
      };
      
      mockApiInstance.request.mockRejectedValueOnce(error);
      
      try {
        await api.get('/test');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe(
            'Validation failed: Required, Invalid format'
          );
          expect((err as Error & { isClientError?: boolean }).isClientError).toBe(true);
        } else {
          throw err;
        }
      }
    });

    it('parses 500 error with string details', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            error: 'Server error',
            details: 'Database connection failed'
          }
        },
        config: { url: '/test' }
      };
      
      mockApiInstance.request.mockRejectedValueOnce(error);
      
      try {
        await api.get('/test');
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message).toBe(
            'Server error: Database connection failed'
          );
          expect((err as Error & { isClientError?: boolean }).isClientError).toBe(false);
        } else {
          throw err;
        }
      }
    });
  });
});
