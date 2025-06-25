import axios from 'axios';
import { apiBaseUrl } from '../constants';
import { apiRetry } from '../utils/apiUtils';
import { TokenManager } from '../utils/tokenUtils';

const getCsrfToken = async (): Promise<string> => {
  try {
    const { data } = await apiRetry(() =>
      axios.get<{ csrfToken: string }>(`${apiBaseUrl}/auth/csrf-token`, {
        withCredentials: true
      })
    );
    return data.csrfToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Failed to fetch CSRF token');
    }
    throw new Error('Failed to fetch CSRF token');
  }
};

interface LoginCredentials {
  email: string;
  password: string;
  _csrf: string;
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

interface VerifyEmailRequest {
  token: string;
}

interface ResendVerificationRequest {
  email: string;
}

const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const { data } = await apiRetry(() =>
      axios.post<LoginResponse>(`${apiBaseUrl}/auth/login`, credentials, {
        headers: {
          'X-CSRF-Token': credentials._csrf
        },
        withCredentials: true
      })
    );
    
    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Login failed: Tokens missing in response');
    }
    
    return data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if (error.response.status === 403) {
          const permission = error.response.data?.missingPermission;
          const message = permission
            ? `You don't have permission to perform this action. Required permission: ${permission}. Please contact your administrator.`
            : 'You don\'t have permission to perform this action. Please contact your administrator.';
          const err = new Error(message);
          err.name = 'PermissionError';
          throw err;
        }
        const message = error.response.data?.error || error.response.statusText;
        interface ErrorWithResponse extends Error {
          response?: {
            data?: unknown;
            status?: number;
            statusText?: string;
            headers?: unknown;
            config?: unknown;
          }
        }
        const err: ErrorWithResponse = new Error(message);
        err.response = error.response;
        throw err;
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
  _csrf: string;
}

const register = async (data: RegisterData): Promise<LoginResponse> => {
  const { data: responseData } = await apiRetry(() =>
    axios.post<LoginResponse>(`${apiBaseUrl}/auth/register`, data, {
      headers: {
        'X-CSRF-Token': data._csrf
      },
      withCredentials: true
    })
  );
  
  if (!responseData.accessToken || !responseData.refreshToken) {
    throw new Error('Registration failed: Tokens missing in response');
  }
  
  TokenManager.storeTokens(responseData.accessToken, responseData.refreshToken);
  return responseData;
};

// Verification functions kept for backward compatibility
const verifyEmail = async (data: VerifyEmailRequest) => {
  return apiRetry(() =>
    axios.post(`${apiBaseUrl}/auth/verify-email`, data)
  );
};

const resendVerification = async (data: ResendVerificationRequest) => {
  return apiRetry(() =>
    axios.post(`${apiBaseUrl}/auth/resend-verification`, data)
  );
};

export default {
  login,
  logout,
  register,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  resendVerification,
  getCsrfToken,
  checkPasswordStrength: async (password: string) => {
    const { data } = await axios.post(`${apiBaseUrl}/auth/check-password-strength`, { password });
    return data;
  },
};
