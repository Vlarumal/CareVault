/**
 * Utility functions for JSON operations
 */
export const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
};

// Re-export other utils for easier imports
export * from './errors';
export * from './logger';
export * from './metrics';
export * from './sanitize';
export * from './validation';
export * from './dateFormatter';
export * from './dbFieldUtils';
export * from './errorHandler';
export * from './queryBuilder';