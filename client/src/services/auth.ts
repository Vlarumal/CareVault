import axios from 'axios';
import { apiBaseUrl } from '../constants';
import { apiRetry } from '../utils/apiUtils';
import { TokenManager } from '../utils/tokenUtils';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: string;
  };
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const { data } = await apiRetry(() =>
      axios.post<LoginResponse>(`${apiBaseUrl}/auth/login`, credentials)
    );
    
    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Login failed: Tokens missing in response');
    }
    
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const message = error.response.data?.error || error.response.statusText;
        throw new Error(message);
      } else {
        throw new Error(error.message || 'Network error');
      }
    } else if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown login error');
  }
};

const requestPasswordReset = async (email: PasswordResetRequest) => {
  return apiRetry(() =>
    axios.post(`${apiBaseUrl}/auth/request-password-reset`, email)
  );
};

const confirmPasswordReset = async (data: PasswordResetConfirm) => {
  return apiRetry(() =>
    axios.post(`${apiBaseUrl}/auth/reset-password`, data)
  );
};

const logout = async (refreshToken: string) => {
  try {
    await apiRetry(() =>
      axios.post(`${apiBaseUrl}/auth/logout`, { refreshToken })
    );
  } catch (error) {
    let errorMessage = 'Logout failed';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.error || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  } finally {
    TokenManager.clearTokens();
    window.dispatchEvent(new Event('logout'));
    localStorage.setItem('logout-event', Date.now().toString());
  }
};

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

const register = async (data: RegisterData): Promise<LoginResponse> => {
  const { data: responseData } = await apiRetry(() =>
    axios.post<LoginResponse>(`${apiBaseUrl}/auth/register`, data)
  );
  
  if (!responseData.accessToken || !responseData.refreshToken) {
    throw new Error('Registration failed: Tokens missing in response');
  }
  
  TokenManager.storeTokens(responseData.accessToken, responseData.refreshToken);
  return responseData;
};

export default {
  login,
  logout,
  register,
  requestPasswordReset,
  confirmPasswordReset,
};
