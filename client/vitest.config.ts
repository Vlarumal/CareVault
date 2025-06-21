import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@shared/': path.resolve(__dirname, '../shared/')
    }
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts', './src/__mocks__/dompurify.ts'],
    globals: true,
    css: true,
    server: {
      deps: {
        inline: ['@mui/x-data-grid'],
      },
    },
  },
});