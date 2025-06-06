/**
 * Security utilities for client-side protection against XSS attacks
 * 
 * @module securityUtils
 */

/**
 * Sanitizes input by removing dangerous HTML tags and attributes
 * @param input - The string to sanitize
 * @returns Sanitized string safe for rendering
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes object properties recursively
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export const sanitizeObject = <T>(obj: T): T => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      return {
        ...acc,
        [key]: sanitizeObject(value)
      };
    }, {} as T);
  }
  
  return obj;
};

/**
 * Validates input against common XSS patterns
 * @param input - Input to validate
 * @throws Error if malicious content is detected
 */
export const validateInput = (input: string): void => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /expression\(/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
    /onclick\s*=/gi,
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      throw new Error('Potentially malicious input detected');
    }
  }
};