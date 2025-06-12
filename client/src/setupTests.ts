import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock DOMPurify with basic sanitization for tests
vi.mock('dompurify', () => ({
  default: {
    sanitize: (input: string) => {
      // Basic sanitization: remove <script> tags and on* attributes
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/ on\w+="[^"]*"/gi, '');
    },
  },
}));
