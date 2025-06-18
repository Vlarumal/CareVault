import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { TokenManager } from '../utils/tokenUtils';
import { api } from '../utils/apiUtils';

interface AuthContextType {
  token: string | null;
  user: { id: string; role: string } | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(TokenManager.getAccessToken());
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    const accessToken = TokenManager.getAccessToken();
    const refreshToken = TokenManager.getRefreshToken();
    
    if (accessToken && refreshToken && TokenManager.validateToken(accessToken)) {
      try {
        const decoded = jwtDecode(accessToken) as { userId: string; role: string };
        setUser({ id: decoded.userId, role: decoded.role });
        setToken(accessToken);
      } catch (error) {
        console.error('Invalid stored token:', error);
        TokenManager.clearTokens();
      }
    } else {
      TokenManager.clearTokens();
    }
    
    const refreshInterval = TokenManager.startRefreshMonitor();
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode(token) as { userId: string; role: string };
      setUser({ id: decoded.userId, role: decoded.role });
    } catch (error) {
      console.error('Token decode error:', error);
      logout();
    }
  }, [token]);

  const login = (accessToken: string, refreshToken: string) => {
    if (typeof accessToken !== 'string' || accessToken.trim() === '') {
      console.error('Login called with invalid access token');
      return;
    }
    if (typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      console.error('Login called with invalid refresh token');
      return;
    }

    try {
      if (!TokenManager.validateToken(accessToken)) {
        throw new Error('Invalid access token structure');
      }
      
      TokenManager.storeTokens(accessToken, refreshToken);
      const decoded = jwtDecode(accessToken) as { userId: string; role: string };
      setToken(accessToken);
      setUser({ id: decoded.userId, role: decoded.role });
    } catch (error) {
      console.error('Invalid tokens provided to login:', error);
      TokenManager.clearTokens();
    }
  };

  const logout = () => {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
          api.post('/auth/logout', { refreshToken })
              .catch(error => console.error('Logout failed:', error));
      }
      
      TokenManager.clearTokens();
      setToken(null);
      setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
