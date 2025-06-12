import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // Remove all HTML tags
    allowedAttributes: {}, // Remove all attributes
    disallowedTagsMode: 'discard', // Completely remove disallowed tags and their content
    exclusiveFilter: (frame) => {
      // Remove all script-related tags and attributes
      if (frame.tag === 'script' || frame.tag === 'iframe' || frame.tag === 'object' || frame.tag === 'embed') {
        return true;
      }
      return false;
    }
  }).trim();
}

export function sanitizeObject<T>(obj: T): T {
  // Handle primitive types
  if (typeof obj !== 'object' || obj === null) {
    // If it's a string, sanitize it
    if (typeof obj === 'string') {
      return sanitizeInput(obj) as unknown as T;
    }
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  // Handle objects
  const sanitizedObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitizedObj[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitizedObj as T;
}