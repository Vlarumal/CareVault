/**
 * Centralized API configuration with credentials support
 * @module apiUtils
 */
  
import axios, { AxiosError, AxiosInstance } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { apiBaseUrl } from '../constants';
  
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
export const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': process.env.NODE_ENV === 'development' ? 'dev-user-id' : undefined
  }
});

api.interceptors.request.use(config => {
  console.debug('Sending payload:', config.data);
  return config;
});
  
api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (error.code === 'ERR_NETWORK') {
      throw new Error('CORS error: Request blocked by browser security policy');
    }
    return Promise.reject(error);
  }
);
  
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
  
      if (error instanceof Error && error.message.includes('CORS error')) {
        throw new Error(
          `CORS failure: ${error.message}. Verify backend CORS configuration`
        );
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
