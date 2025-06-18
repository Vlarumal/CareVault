import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('dompurify', () => ({
  default: {
    sanitize: (input: string) => {
      return input
        .replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          ''
        )
        .replace(/ on\w+="[^"]*"/gi, '');
    },
  },
}));

// // Create mock API instance
// const mockApi = axios.create();
// mockApi.interceptors = {
//   request: { use: vi.fn() },
//   response: { use: vi.fn() }
// };

// // Mock API utils module
// vi.mock('../utils/apiUtils', () => ({
//   api: mockApi,
//   apiRetry: vi.fn(),
//   sanitizeRequestData: vi.fn(),
//   createDeduplicatedQuery: vi.fn(),
//   queryClient: {
//     fetchQuery: vi.fn()
//   }
// }));
