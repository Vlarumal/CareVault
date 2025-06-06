import { JSDOM } from 'jsdom';
import * as DOMPurify from 'dompurify';

const { window } = new JSDOM('');
const dompurify = DOMPurify.default(window);

export function sanitizeInput(input: string): string {
  return dompurify.sanitize(input, {
    ALLOWED_TAGS: [], // Remove all HTML tags
    ALLOWED_ATTR: []  // Remove all attributes
  }).trim();
}

export function sanitizeObject<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  const sanitizedObj: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      sanitizedObj[key] = typeof value === 'string'
        ? sanitizeInput(value)
        : sanitizeObject(value);
    }
  }

  return sanitizedObj as T;
}