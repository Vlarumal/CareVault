import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth, isTokenValidFormat } from './AuthContext';
import { vi, describe, it, beforeEach, expect, afterEach, Mock } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockJwtDecode = vi.hoisted(() => {
  return vi.fn().mockImplementation((token) => {
    if (token === 'valid.token.here') {
      return {
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
    }
    if (token === 'expired.token.here') {
      return {
        email: 'expired@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600 // expired 1 hour ago
      };
    }
    throw new Error('Invalid token');
  });
});

vi.mock('jwt-decode', () => ({
  default: mockJwtDecode,
  jwtDecode: mockJwtDecode
}));

describe('AuthContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('validates token format correctly', () => {
    const validToken = 'header.payload.signature';
    expect(isTokenValidFormat(validToken)).toBe(true);

    expect(isTokenValidFormat('headerpayloadsignature')).toBe(false);
    expect(isTokenValidFormat('header.payload')).toBe(false);
    expect(isTokenValidFormat('')).toBe(false);
  });

  it('rejects invalid token formats during login', () => {
    const invalidToken = 'invalid.token.format.missing.part';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponent = () => {
      const auth = useAuth();
      return <button onClick={() => auth.login(invalidToken)}>LoginInvalidToken</button>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByRole('button', { name: 'LoginInvalidToken' });
    act(() => {
      loginButton.click();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid token format: Token must have 3 parts separated by dots');
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('handles token storage failures during login', async () => {
    const validToken = 'valid.token.here';
    const error = new Error('Storage failed');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (localStorage.setItem as Mock).mockImplementationOnce(() => {
      throw error;
    });

    const TestComponent = () => {
      const auth = useAuth();
      return <button onClick={() => auth.login(validToken)}>LoginStorageFailure</button>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByRole('button', { name: 'LoginStorageFailure' });
    await act(async () => {
      loginButton.click();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid token provided to login:', error);
    expect(localStorage.setItem).toHaveBeenCalledWith('token', validToken);
  });

  it('logs out immediately if token is expired on initialization', () => {
    const expiredToken = 'expired.token.here';
    localStorage.setItem('token', expiredToken);
      
    mockJwtDecode.mockImplementation((token) => {
      if (token === 'expired.token.here') {
        return {
          email: 'expired@example.com',
          exp: 1 // Fixed expiration in distant past
        };
      }
      return mockJwtDecode(token);
    });

    const TestComponent = () => {
      const auth = useAuth();
      return (
        <>
          <div data-testid="auth-state">{auth.token ? 'LoggedIn' : 'LoggedOut'}</div>
          <div data-testid="user-email">{auth.user?.email || 'NoUser'}</div>
        </>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-state')).toHaveTextContent('LoggedOut');
    expect(screen.getByTestId('user-email')).toHaveTextContent('NoUser');
  });

  it('handles token decode errors during initialization', () => {
    const invalidToken = 'invalid.token.here';
    localStorage.setItem('token', invalidToken);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponent = () => {
      const auth = useAuth();
      return <div data-testid="auth-status">{auth.token ? 'LoggedIn' : 'LoggedOut'}</div>;
    };
    
    mockJwtDecode.mockImplementation((token) => {
      if (token === 'invalid.token.here') {
        throw new Error('Invalid token');
      }
      return mockJwtDecode(token);
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid stored token:', expect.any(Error));
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('LoggedOut');
  });

  it('removes token on logout', () => {
    const validToken = 'valid.token.here';
    localStorage.setItem('token', validToken);
    
    const TestComponent = () => {
      const auth = useAuth();
      return <button onClick={() => auth.logout()}>LogoutButton</button>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutButton = screen.getByRole('button', { name: 'LogoutButton' });
    act(() => {
      logoutButton.click();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });
});
