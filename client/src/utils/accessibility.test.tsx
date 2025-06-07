import React from 'react';
import { render } from '@testing-library/react';
import App from '../App';
import { test, expect } from 'vitest';
import * as axe from 'axe-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('Homepage should have no accessibility violations', async () => {
  const queryClient = new QueryClient();
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
  const results = await axe.run(container);
  expect(results.violations).toHaveLength(0);
});
