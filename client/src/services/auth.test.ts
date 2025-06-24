import auth from './auth';
import axios from 'axios';
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  Mocked
} from 'vitest';
import { TokenManager } from '../utils/tokenUtils';

vi.mock('axios');
vi.mock('../utils/tokenUtils', () => ({
  TokenManager: {
    clearTokens: vi.fn(),
    storeTokens: vi.fn(),
    getRefreshToken: vi.fn(() => 'mock-refresh-token'),
  }
}));

const mockedAxios = axios as Mocked<typeof axios>;

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('successfully logs in and returns tokens', async () => {
      const mockResponse = {
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password' };
      const result = await auth.login(credentials);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
      expect(TokenManager.storeTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('throws error for invalid token format', async () => {
      const mockResponse = {
        data: { token: 'invalid' }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      await expect(
        auth.login({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('Invalid token format received from server');
    });
  });

  describe('logout', () => {
    it('successfully logs out', async () => {
      mockedAxios.post.mockResolvedValue({});

      await auth.logout('refresh-token');

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: 'refresh-token' });
      expect(TokenManager.clearTokens).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('successfully registers and stores tokens', async () => {
      const mockResponse = {
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token'
        }
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const data = { email: 'test@example.com', password: 'password', name: 'Test User' };
      const result = await auth.register(data);

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/register', data);
      expect(result).toEqual(mockResponse.data);
      expect(TokenManager.storeTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });
  });

  // Tests for requestPasswordReset and confirmPasswordReset would go here
});
