import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ProblematicComponent = () => {
  throw new Error('Test error');
  return <div>Should not render</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
