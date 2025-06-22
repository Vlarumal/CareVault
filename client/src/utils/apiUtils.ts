/**
 * Centralized API configuration with credentials support
 * @module apiUtils
 */
  
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { apiBaseUrl } from '../constants';
import { TokenManager } from './tokenUtils';

declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}
  
/**
 * Global query client instance for query deduplication
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});
  
/**
 * Axios instance with credentials and base URL configuration
 */
const apiInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': process.env.NODE_ENV === 'development' ? 'dev-user-id' : undefined
  }
});

apiInstance.interceptors.request.use(config => {
  console.debug('[DEBUG] API Request:', {
    url: config.url,
    method: config.method,
    data: config.data
  });
  return config;
});

apiInstance.interceptors.request.use(config => {
  const token = TokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiInstance.interceptors.response.use(
  response => {
    console.debug('[DEBUG] API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error: AxiosError) => {
    console.debug('[DEBUG] API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 &&
        (error.response.data as { code?: string })?.code === 'TOKEN_EXPIRED' &&
        originalRequest &&
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        const newToken = await TokenManager.refreshAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiInstance(originalRequest);
      } catch (refreshError) {
        TokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    if (error.response && (error.response.status === 400 || error.response.status >= 500)) {
      interface ApiErrorResponse {
        error?: string;
        userMessage?: string;
        details?: unknown;
      }
      
      const responseData = error.response.data as ApiErrorResponse;
      
      const customError = new Error(
        responseData.userMessage || responseData.error || 'An error occurred'
      ) as Error & { isClientError?: boolean; errors?: Record<string, string> };
      
      customError.isClientError = (error.response.status === 400);
      
      if (responseData.details) {
        if (typeof responseData.details === 'object' && !Array.isArray(responseData.details)) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(responseData.details).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              fieldErrors[field] = messages.join(', ');
            } else {
              fieldErrors[field] = String(messages);
            }
          });
          customError.errors = fieldErrors;
        }
      }
      
      return Promise.reject(customError);
    }
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('CORS error: Request blocked by browser security policy');
    }
    
    return Promise.reject(error);
  }
);

export const api: AxiosInstance = apiInstance;
  
export const apiRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`API attempt ${attempt} failed:`, error);

      if (error instanceof Error) {
        if (error.message.includes('CORS error')) {
          throw new Error(
            `CORS failure: ${error.message}. Verify backend CORS configuration`
          );
        }
        const clientError = error as { isClientError?: boolean };
        if (clientError.isClientError) {
          throw error;
        }
      }

      const isNetworkError = !(error instanceof AxiosError) || error.code === 'ERR_NETWORK';
      const isServerError = error instanceof AxiosError && error.response && error.response.status >= 500;
      
      if (!isNetworkError && !isServerError) {
        throw error;
      }

      if (attempt === maxRetries) throw error;

      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
};
  
/**
 * Sanitizes API request data to prevent XSS attacks
 * @param data - The data to sanitize
 * @returns Sanitized data
 */
export const sanitizeRequestData = <T>(data: T): T => {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data) as T;
  }
  return JSON.parse(DOMPurify.sanitize(JSON.stringify(data))) as T;
};
  
/**
 * Creates a deduplicated query function for API calls
 * @param queryKey - Unique key for query deduplication
 * @param queryFn - The actual query function
 * @returns Deduplicated query function
 */
export const createDeduplicatedQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>
) => {
  return async () => {
    return queryClient.fetchQuery({
      queryKey,
      queryFn,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
};
