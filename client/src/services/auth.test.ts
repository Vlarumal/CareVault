import auth from './auth';
import axios from 'axios';
import {
  Mock,
  vi,
  describe,
  it,
  expect,
  beforeEach,
  Mocked,
} from 'vitest';
import { handleTokenStorage } from '../utils/tokenUtils';

vi.mock('axios');
const mockedAxios = axios as Mocked<typeof axios>;

vi.mock('../utils/tokenUtils', () => ({
  isTokenValidFormat: vi
    .fn()
    .mockImplementation((token) => token && token.includes('.')),
  handleTokenStorage: vi.fn(),
}));

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('handles token storage failures during login', async () => {
    const token = 'valid.token.here';
    const error = new Error('Storage failed');
    const credentials = {
      email: 'test@example.com',
      password: 'password',
    };

    mockedAxios.post.mockResolvedValueOnce({ data: { token } });

    (handleTokenStorage as Mock).mockImplementationOnce(() => {
      throw error;
    });

    try {
      await auth.login(credentials);
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe('Failed to update token storage');
      } else {
        throw err;
      }
    }

    expect(handleTokenStorage).toHaveBeenCalledWith(token);
  });

  it('handles token storage failures during registration', async () => {
    const token = 'valid.token.here';
    const err = new Error('Storage failed');
    const userData = {
      email: 'test@example.com',
      password: 'password',
      name: 'Test User',
    };

    mockedAxios.post.mockResolvedValueOnce({ data: { token } });

    (handleTokenStorage as Mock).mockImplementationOnce(() => {
      throw err;
    });

    try {
      await auth.register(userData);
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe('Failed to update token storage');
      } else {
        throw err;
      }
    }

    expect(handleTokenStorage).toHaveBeenCalledWith(token);
  });

  it('rejects login with invalid token format from server', async () => {
    const invalidToken = 'invalidtoken';
    const credentials = {
      email: 'test@example.com',
      password: 'password',
    };

    // Mock API response with invalid token
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: invalidToken },
    });

    try {
      await auth.login(credentials);
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe(
          'Invalid token format received from server'
        );
      } else {
        throw err;
      }
    }

    expect(handleTokenStorage).not.toHaveBeenCalled();
  });

  it('handles refresh token storage failures', async () => {
    const token = 'valid.token.here';
    const error = new Error('Storage failed');
    localStorage.setItem('token', token);

    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'new.token.here' },
    });

    (handleTokenStorage as Mock).mockImplementationOnce(() => {
      throw error;
    });

    try {
      await auth.refreshToken();
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe('Failed to update token storage');
      } else {
        throw error;
      }
    }
  });
});
