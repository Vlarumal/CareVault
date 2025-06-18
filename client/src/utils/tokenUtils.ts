import { jwtDecode } from "jwt-decode";

export class TokenManager {
  static storeTokens(access: string | null, refresh: string | null): void {
    try {
      if (access === null) {
        localStorage.removeItem('accessToken');
      } else {
        localStorage.setItem('accessToken', access);
      }

      if (refresh === null) {
        sessionStorage.removeItem('refreshToken');
      } else {
        sessionStorage.setItem('refreshToken', refresh);
      }
    } catch (error) {
      console.error('Token storage failed:', error);
      throw new Error('Failed to store tokens');
    }
  }

  static clearTokens(): void {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }

  static getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  static getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken');
  }

  static setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  static setRefreshToken(token: string): void {
    sessionStorage.setItem('refreshToken', token);
  }

  static startRefreshMonitor(): NodeJS.Timeout {
    return setInterval(async () => {
      const accessToken = this.getAccessToken();
      const refreshToken = this.getRefreshToken();
      
      if (!accessToken || !refreshToken) return;
      
      try {
        const { exp } = jwtDecode(accessToken);
        if (exp && Date.now() >= exp * 1000 - 60000) { // Refresh 60s before expiry
          await this.refreshTokens();
        }
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    }, 30000); // Check every 30s
  }

  static async refreshTokens(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return;

    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        this.storeTokens(accessToken, newRefreshToken);
      } else {
        this.clearTokens();
      }
    } catch (error) {
      this.clearTokens();
      console.error('Token refresh failed:', error);
    }
  }

  static async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        this.setAccessToken(accessToken);
        this.setRefreshToken(newRefreshToken);
        return accessToken;
      } else {
        this.clearTokens();
        throw new Error('Failed to refresh access token');
      }
    } catch (error) {
      this.clearTokens();
      throw new Error('Failed to refresh access token');
    }
  }

  static validateToken(token: string): boolean {
    try {
      const decoded = jwtDecode(token);
      if (!decoded || typeof decoded !== 'object') return false;
      
      const now = Date.now() / 1000;
      if (decoded.exp && decoded.exp < now) return false;
      
      return 'userId' in decoded;
    } catch (error) {
      return false;
    }
  }
}