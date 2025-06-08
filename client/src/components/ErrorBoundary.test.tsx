import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, vi, type Mock } from 'vitest';
import ErrorBoundary from './ErrorBoundary';
import { afterEach } from 'vitest';
import { test } from 'vitest';

// Component that throws an error
const ProblematicComponent = () => {
  throw new Error('Test error');
  return <div>Should not render</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  test('displays fallback UI when child throws error', async () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );
    
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).toHaveTextContent('Test error');
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Report Error')).toBeInTheDocument();
  });

  test('displays custom fallback when provided', async () => {
    const customFallback = <div role="alert">Custom error message</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <ProblematicComponent />
      </ErrorBoundary>
    );
    
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Custom error message');
  });

  test('calls onError callback when error occurs', async () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ProblematicComponent />
      </ErrorBoundary>
    );
    
    await screen.findByRole('alert');
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });

  test('shows error details in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );
    
    const details = await screen.findByText('Error details');
    expect(details).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  test('hides error details in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );
    
    await screen.findByRole('alert');
    expect(screen.queryByText('Error details')).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  test('report error button shows alert', async () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );
    
    const reportButton = await screen.findByText('Report Error');
    fireEvent.click(reportButton);
    
    expect(window.alert).toHaveBeenCalled();
    const alertMessage = (window.alert as Mock).mock.calls[0][0];
    expect(alertMessage).toContain('Test error');
  });

test('recovers after retry button click', async () => {
  // Component that always throws
  const ErrorComponent = () => {
    throw new Error('Test error');
  };

  // Component that renders successfully
  const SuccessComponent = () => <div data-testid="recovered">Recovered content</div>;
  
  // First render with error component
  const { rerender } = render(
    <ErrorBoundary>
      <ErrorComponent />
    </ErrorBoundary>
  );
  
  // Verify error state
  const alert = await screen.findByRole('alert');
  expect(alert).toBeInTheDocument();
  
  // Rerender with success component
  rerender(
    <ErrorBoundary>
      <SuccessComponent />
    </ErrorBoundary>
  );
  
  // Click retry button
  fireEvent.click(screen.getByText('Retry'));
  
  // Verify recovery
  expect(await screen.findByTestId('recovered')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('handles error in same component after recovery', async () => {
  // Component that can throw on command
  const ToggleErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Controlled error');
    }
    return <div data-testid="normal-state">Normal content</div>;
  };
  
  const { rerender } = render(
    <ErrorBoundary>
      <ToggleErrorComponent shouldThrow={true} />
    </ErrorBoundary>
  );
  
  // Verify initial error
  const alert = await screen.findByRole('alert');
  expect(alert).toBeInTheDocument();
  
  // Recover
  rerender(
    <ErrorBoundary>
      <ToggleErrorComponent shouldThrow={false} />
    </ErrorBoundary>
  );
  fireEvent.click(screen.getByText('Retry'));
  expect(await screen.findByTestId('normal-state')).toBeInTheDocument();
  
  // Cause error again in the same component
  rerender(
    <ErrorBoundary>
      <ToggleErrorComponent shouldThrow={true} />
    </ErrorBoundary>
  );
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});
});
