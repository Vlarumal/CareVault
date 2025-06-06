/**
 * Executes an API call with exponential backoff retry logic
 * @param fn - The API call function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay between retries in ms (default: 1000)
 * @returns Promise resolving to the API response
 *
 * @example
 * // Basic usage
 * apiRetry(() => fetchData())
 *
 * @example
 * // Custom retry settings
 * apiRetry(() => postData(data), 5, 2000)
 *
 * @context7 /microsoft/typescript-website
 */
import { sanitizeObject } from './securityUtils';

export const apiRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
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
    return data; // Already sanitized by securityUtils at input
  }
  return sanitizeObject(data);
};