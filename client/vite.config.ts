import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '.', // Load environment variables from current directory
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@shared/': path.resolve(__dirname, '../shared/')
    }
  },
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts', './src/__mocks__/dompurify.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
